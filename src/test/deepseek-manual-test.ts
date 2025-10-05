/**
 * Manual DeepSeek Test Command
 * Commande de test manuel DeepSeek
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { DeepSeekClient } from '../ai/clients/deepseek-client';

/**
 * Register manual test command
 * Enregistrer la commande de test manuel
 */
export function registerDeepSeekTestCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('ai-analytics.testDeepSeek', async () => {
        try {
            const deepseekClient = new DeepSeekClient(context);
            await deepseekClient.initialize();

            const isAvailable = await deepseekClient.isAvailable();
            if (!isAvailable) {
                vscode.window.showErrorMessage('DeepSeek API key not configured. Please set aiAnalytics.deepseekApiKey in settings.');
                return;
            }

            // Test with a simple prompt
            // Tester avec un prompt simple
            const prompt = 'Réponds en français : Quelles sont les principales caractéristiques de DeepSeek ?';

            vscode.window.showInformationMessage('Testing DeepSeek API...');

            const response = await deepseekClient.execute(prompt);

            // Send results to AI Command Bar
            // Envoyer les résultats à la barre de commande IA
            const results = {
                prompt,
                response: response.content,
                provider: response.provider,
                tokens: response.tokens,
                cost: response.cost,
                latency: response.latency,
                model: response.model,
                timestamp: new Date().toISOString()
            };

            // Try to send to AI Command Bar
            // Essayer d'envoyer à la barre de commande IA
            try {
                await vscode.commands.executeCommand('ai-command-bar.focus');

                // Send message to show test results
                // Envoyer un message pour afficher les résultats de test
                vscode.commands.executeCommand('ai-analytics.showTestResults', results);
            } catch (error) {
                // Fallback to output channel if command bar is not available
                // Retour au canal de sortie si la barre de commande n'est pas disponible
                const outputChannel = vscode.window.createOutputChannel('AI Analytics - DeepSeek Test');
                outputChannel.show();
                outputChannel.appendLine('=== DeepSeek API Test Results ===');
                outputChannel.appendLine(`Prompt: ${prompt}`);
                outputChannel.appendLine(`Response: ${response.content}`);
                outputChannel.appendLine(`Provider: ${response.provider}`);
                outputChannel.appendLine(`Tokens: ${response.tokens}`);
                outputChannel.appendLine(`Cost: $${response.cost.toFixed(6)}`);
                outputChannel.appendLine(`Latency: ${response.latency}ms`);
                outputChannel.appendLine(`Model: ${response.model}`);
                outputChannel.appendLine('================================');
            }

            vscode.window.showInformationMessage(`DeepSeek test completed! Cost: $${response.cost.toFixed(6)}`);

        } catch (error) {
            vscode.window.showErrorMessage(`DeepSeek test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Quick test function for development
 * Fonction de test rapide pour le développement
 */
export async function quickDeepSeekTest(context: vscode.ExtensionContext, prompt: string = 'Hello, DeepSeek!'): Promise<void> {
    const deepseekClient = new DeepSeekClient(context);
    await deepseekClient.initialize();

    if (!await deepseekClient.isAvailable()) {
        console.warn('DeepSeek API key not configured');
        return;
    }

    console.time('DeepSeek API Call');
    const response = await deepseekClient.execute(prompt);
    console.timeEnd('DeepSeek API Call');

    console.log('DeepSeek Response:', {
        content: response.content,
        tokens: response.tokens,
        cost: response.cost,
        latency: response.latency
    });
}