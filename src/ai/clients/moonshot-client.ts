/**
 * Moonshot (Kimi) Client
 * Client Moonshot (Kimi)
 */

import * as vscode from 'vscode';
import * as https from 'https';
import { BaseAIClient } from './base-client';
import { AIProvider, AIResponse, StreamingCallback } from '../types';
import { loadSystemPrompt } from '../system-prompt-loader';

export class MoonshotClient extends BaseAIClient {
    private apiKey: string = '';

    async initialize(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const configApiKey = config.get('moonshotApiKey') as string;
        if (configApiKey && configApiKey.trim() !== '') {
            this.apiKey = configApiKey;
        } else {
            const secretApiKey = await this.getApiKey('moonshot-api-key');
            if (secretApiKey && secretApiKey.trim() !== '') {
                this.apiKey = secretApiKey;
            }
        }
        this.isInitialized = true;
    }

    async execute(prompt: string): Promise<AIResponse> {
        if (!this.isInitialized) await this.initialize();
        if (!this.apiKey) throw new Error('Moonshot API key not configured');

        const startTime = Date.now();
        const apiResponse = await this.kimiChat(prompt, false);
        const latency = Date.now() - startTime;

        const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
        const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
        const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

        return {
            content: apiResponse.content,
            provider: 'moonshot',
            tokens: totalTokens,
            cost: this.calculateCost(inputTokens, outputTokens),
            latency,
            cacheHit: false,
            model: 'moonshot-v1-8k' // default example
        };
    }

    override async executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse> {
        if (!this.isInitialized) await this.initialize();
        if (!this.apiKey) throw new Error('Moonshot API key not configured');

        const startTime = Date.now();
        const apiResponse = await this.kimiChat(prompt, true, streamingCallback);
        const latency = Date.now() - startTime;

        const inputTokens = apiResponse.usage?.prompt_tokens || this.calculateTokens(prompt);
        const outputTokens = apiResponse.usage?.completion_tokens || this.calculateTokens(apiResponse.content);
        const totalTokens = apiResponse.usage?.total_tokens || inputTokens + outputTokens;

        return {
            content: apiResponse.content,
            provider: 'moonshot',
            tokens: totalTokens,
            cost: this.calculateCost(inputTokens, outputTokens),
            latency,
            cacheHit: false,
            model: 'moonshot-v1-8k'
        };
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey !== undefined && this.apiKey.trim() !== '';
    }

    getProvider(): AIProvider {
        return 'moonshot';
    }

    async setApiKey(apiKey: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        await config.update('moonshotApiKey', apiKey, vscode.ConfigurationTarget.Global);
        await this.storeApiKey('moonshot-api-key', apiKey);
        this.apiKey = apiKey;
    }

    private async kimiChat(prompt: string, stream = false, streamingCallback?: StreamingCallback): Promise<{ content: string; usage?: any }> {
        // Endpoint and payload based on Moonshot docs
        // https://platform.moonshot.ai/docs/guide/start-using-kimi-api
        const apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
        const systemPrompt = loadSystemPrompt();
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const defaultModel = (config.get('moonshotDefaultModel') as string) || 'moonshot-v1-8k';
        const requestBody = {
            model: defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            stream
        };

        if (stream && streamingCallback) {
            return await this.makeStreamingApiRequest(apiUrl, requestBody, streamingCallback);
        }
        const data = await this.makeApiRequest(apiUrl, requestBody);
        const content = data.choices?.[0]?.message?.content || '';
        return { content, usage: data.usage };
    }

    private async makeApiRequest(url: string, body: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                    } else {
                        reject(new Error(`API error ${res.statusCode}: ${data}`));
                    }
                });
            });
            req.on('error', err => reject(err));
            req.write(postData);
            req.end();
        });
    }

    private async makeStreamingApiRequest(url: string, body: any, streamingCallback: StreamingCallback): Promise<{ content: string; usage?: any }> {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(body);
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            let fullContent = '';
            let usage: any = null;
            const req = https.request(options, (res) => {
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const dataStr = line.substring(6);
                            if (dataStr === '[DONE]') {
                                resolve({ content: fullContent, usage });
                                return;
                            }
                            try {
                                const data = JSON.parse(dataStr);
                                const delta = data.choices?.[0]?.delta;
                                if (delta?.content) {
                                    fullContent += delta.content;
                                    streamingCallback.onChunk(fullContent);
                                }
                                if (data.usage) usage = data.usage;
                            } catch (e) {
                                // ignore parse errors in stream chunks
                            }
                        }
                    }
                });
                res.on('end', () => resolve({ content: fullContent, usage }));
            });
            req.on('error', err => reject(err));
            req.write(postData);
            req.end();
        });
    }
}


