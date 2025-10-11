/**
 * AI Command Bar WebView Provider - Mockup Version
 * Fournisseur WebView de la barre de commande IA - Version Mockup
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIRouter } from '../../ai/router/router';
import { AnalyticsManager } from '../../analytics/manager';
import { AICoach } from '../../coaching/coach';
import { SessionManager } from '../../sessions/manager';
import { AIRoutingMode, AIProvider, StreamingCallback } from '../../ai/types';
import { ModelChecker } from '../../ai/model-checker';
import { ProviderManager } from '../../ai/providers/provider-manager';

/**
 * AI Command Bar WebView Provider - Mockup
 * Fournisseur WebView de la barre de commande IA - Mockup
 */
export class AICommandBarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai-command-bar';

    private _view?: vscode.WebviewView;
    private readonly extensionUri: vscode.Uri;
    private readonly aiRouter: AIRouter;
    private readonly aiCoach: AICoach;
    private readonly sessionManager: SessionManager;
    private readonly context: vscode.ExtensionContext;
    private readonly modelChecker: ModelChecker;
    private readonly providerManager: ProviderManager;

    constructor(
        extensionUri: vscode.Uri,
        aiRouter: AIRouter,
        _analyticsManager: AnalyticsManager,
        aiCoach: AICoach,
        sessionManager: SessionManager,
        context: vscode.ExtensionContext
    ) {
        this.extensionUri = extensionUri;
        this.aiRouter = aiRouter;
        this.aiCoach = aiCoach;
        this.sessionManager = sessionManager;
        this.context = context;
        this.modelChecker = new ModelChecker();
        this.providerManager = new ProviderManager(context);

        // Initialize provider manager
        this.providerManager.initialize().catch(error => {
            console.error('❌ Failed to initialize Provider Manager:', error);
        });

        // Temporary usage to avoid TypeScript error
        console.log('Session Manager initialized:', this.sessionManager.constructor.name);

        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('aiAnalytics')) {
                    console.log('AI Analytics configuration changed, updating command bar...');
                    this.handleGetSettings();
                }
            })
        );
    }

    /**
     * Resolve webview view
     * Résoudre la vue webview
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('🔍 [COMMAND-BAR] resolveWebviewView called - creating webview');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };

        const html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.html = html;
        console.log('✅ [COMMAND-BAR] WebView HTML loaded');
        console.log('📄 [COMMAND-BAR] HTML contains file-autocomplete:', html.includes('file-autocomplete'));

        // Reset any stuck loading states
        console.log('🔄 [COMMAND-BAR] Sending resetLoadingState message');
        this._view.webview.postMessage({
            type: 'resetLoadingState'
        });

        webviewView.webview.onDidReceiveMessage(
            async data => {
                console.log(`📥 [COMMAND-BAR] Received message type: ${data.type}`, data);
                switch (data.type) {
                    case 'executePrompt':
                        console.log('📥 [COMMAND-BAR-DEBUG] Received executePrompt message from webview');
                        console.log('📋 [COMMAND-BAR-DEBUG] Data received:', {
                            prompt: data.prompt?.substring(0, 50) + '...',
                            routingMode: data.routingMode,
                            provider: data.provider,
                            model: data.model,
                            conversationContextLength: data.conversationContext?.length || 0
                        });
                        await this.handleExecutePrompt(data.prompt, data.routingMode, data.provider, data.model, data.conversationContext);
                        break;
                    case 'getSettings':
                        await this.handleGetSettings();
                        break;
                    case 'updateSettings':
                        await this.handleUpdateSettings(data.settings);
                        break;
                    case 'showTestResults':
                        this.showTestResults(data.results);
                        break;
                    case 'getProjectFiles':
                        await this.handleGetProjectFiles();
                        break;
                    case 'selectModel':
                        await vscode.commands.executeCommand('ai-analytics.selectModel');
                        break;
                    case 'searchFiles':
                        await this.handleSearchFiles(data.query);
                        break;
                    case 'showInformationMessage':
                        vscode.window.showInformationMessage(data.message);
                        break;
                    case 'saveMetrics':
                        await this.handleSaveMetrics(data.metrics);
                        break;
                    case 'loadMetrics':
                        await this.handleLoadMetrics();
                        break;
                    case 'codeAction':
                        await this.handleCodeAction(data);
                        break;
                    case 'openSettings':
                        await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:user.ai-developer-analytics');
                        break;
                    case 'checkProviderModels':
                        await this.handleCheckProviderModels(data.provider, data.messageId);
                        break;
                    case 'getModels':
                        console.log('📥 [COMMAND-BAR] Received getModels request for provider:', data.provider);
                        await this.handleGetModels(data.provider);
                        break;
                    case 'getProvidersStatus':
                        console.log('📥 [COMMAND-BAR] Received getProvidersStatus request');
                        await this.handleGetProvidersStatus();
                        break;
                    case 'webviewReady':
                        console.log('WebView is ready and loaded');
                        // Send initial settings when webview is ready
                        await this.handleGetSettings();
                        break;
                }
            }
        );
    }

    /**
     * Handle prompt execution with real streaming
     * Gérer l'exécution du prompt avec vrai streaming
     */
    private async handleExecutePrompt(
        prompt: string,
        routingMode: AIRoutingMode,
        provider?: AIProvider | 'auto',
        model?: string,
        conversationContext?: any[]
    ) {
        console.log('🔍 [COMMAND-BAR-DEBUG] handleExecutePrompt called');
        console.log('📝 [COMMAND-BAR-DEBUG] Prompt:', prompt.substring(0, 100) + '...');
        console.log('🎯 [COMMAND-BAR-DEBUG] Routing mode:', routingMode);
        console.log('🤖 [COMMAND-BAR-DEBUG] Provider:', provider);
        console.log('🧠 [COMMAND-BAR-DEBUG] Model:', model);
        console.log('💬 [COMMAND-BAR-DEBUG] Conversation context length:', conversationContext?.length || 0);

        if (!this._view) {
            console.error('❌ [COMMAND-BAR-DEBUG] No webview available!');
            return;
        }

        try {
            console.log('🚀 [COMMAND-BAR-DEBUG] Sending executionStarted message to webview');
            this._view.webview.postMessage({
                type: 'executionStarted',
                prompt
            });

            console.log('📡 [COMMAND-BAR-DEBUG] Sending streamingStarted message to webview');
            // Create a streaming response element in the UI
            this._view.webview.postMessage({
                type: 'streamingStarted',
                provider: provider || 'auto',
                model: model
            });

            // Set up timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                this._view?.webview.postMessage({
                    type: 'executionError',
                    error: 'Request timeout - AI service did not respond'
                });
            }, 30000); // 30 second timeout

            // Define streaming callbacks
            const streamingCallback: StreamingCallback = {
                onChunk: (chunk: string) => {
                    this._view?.webview.postMessage({
                        type: 'streamingChunk',
                        content: chunk,
                        provider: provider || 'auto'
                    });
                },
                onComplete: async (response: any) => {
                    clearTimeout(timeoutId); // Clear timeout on completion
                    
                    // Send final metrics
                    this._view?.webview.postMessage({
                        type: 'executionCompleted',
                        response: response.content,
                        provider: response.provider,
                        model: response.model,
                        latency: response.latency,
                        tokens: response.tokens,
                        cost: response.cost,
                        cacheHit: response.cacheHit
                    });

                    // Get coaching advice
                    const advice = await this.aiCoach.getAdvice(prompt, response);
                    if (advice) {
                        this._view?.webview.postMessage({
                            type: 'coachingAdvice',
                            advice
                        });
                    }
                },
                onError: (error: any) => {
                    clearTimeout(timeoutId); // Clear timeout on error
                    
                    this._view?.webview.postMessage({
                        type: 'executionError',
                        error: error.message
                    });
                }
            };

            console.log('🔄 [COMMAND-BAR-DEBUG] Calling AI Router with streaming...');
            // Execute with real streaming and conversation context
            await this.aiRouter.executeWithStreaming(prompt, routingMode, provider, model, streamingCallback, conversationContext);
            console.log('✅ [COMMAND-BAR-DEBUG] AI Router execution completed');

        } catch (error) {
            console.error('❌ [COMMAND-BAR-DEBUG] Error in handleExecutePrompt:', error);
            this._view.webview.postMessage({
                type: 'executionError',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle get settings
     * Gérer l'obtention des paramètres
     */
    private async handleGetSettings() {
        if (!this._view) {
            return;
        }

        const config = vscode.workspace.getConfiguration('aiAnalytics');
        const settings = {
            ollamaEnabled: config.get('ollamaEnabled'),
            ollamaUrl: config.get('ollamaUrl'),
            defaultOllamaModel: config.get('defaultOllamaModel'),
            routingMode: config.get('routingMode'),
            telemetryEnabled: config.get('telemetryEnabled'),
            hotReloadEnabled: config.get('hotReloadEnabled'),
            fontSize: config.get('fontSize', 13),
            // New configurable settings
            commandBarFontFamily: config.get('commandBarFontFamily'),
            commandBarFontSize: config.get('commandBarFontSize'),
            chatFontSize: config.get('chatFontSize'),
            aiResponseFontSize: config.get('aiResponseFontSize'),
            codeBlockFontSize: config.get('codeBlockFontSize'),
            inlineCodeFontSize: config.get('inlineCodeFontSize'),
            inputFontSize: config.get('inputFontSize'),
            dropdownFontSize: config.get('dropdownFontSize'),
            coachFontSize: config.get('coachFontSize'),
            metricsFontSize: config.get('metricsFontSize'),
            defaultEngine: config.get('defaultEngine'),
            defaultTaskType: config.get('defaultTaskType'),
            defaultMode: config.get('defaultMode'),
            moonshotDefaultModel: config.get('moonshotDefaultModel'),
            accentColor: config.get('accentColor'),
            showMetrics: config.get('showMetrics'),
            coachEnabled: config.get('coachEnabled'),
            coachCollapsedByDefault: config.get('coachCollapsedByDefault'),
            sessionTabsEnabled: config.get('sessionTabsEnabled'),
            autoExpandTextarea: config.get('autoExpandTextarea'),
            streamingEnabled: config.get('streamingEnabled'),
            // API Keys
            openaiApiKey: config.get('openaiApiKey'),
            anthropicApiKey: config.get('anthropicApiKey'),
            deepseekApiKey: config.get('deepseekApiKey'),
            moonshotApiKey: config.get('moonshotApiKey')
        };

        this._view.webview.postMessage({
            type: 'settingsUpdated',
            settings
        });
    }

    /**
     * Handle update settings
     * Gérer la mise à jour des paramètres
     */
    private async handleUpdateSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('aiAnalytics');

        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }

        if (this._view) {
            this._view.webview.postMessage({
                type: 'settingsUpdated',
                settings
            });
        }
    }

    /**
     * Show test results in the command bar
     * Afficher les résultats de test dans la barre de commande
     */
    public showTestResults(results: any) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'testResults',
                results
            });
        }
    }

    /**
     * Update selected model in webview
     * Mettre à jour le modèle sélectionné dans la webview
     */
    public updateSelectedModel(model: string) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateSelectedModel',
                model
            });
        }
    }

    /**
     * Handle get project files for autocomplete
     * Gérer l'obtention des fichiers du projet pour l'autocomplétion
     */
    private async handleGetProjectFiles() {
        if (!this._view) {
            return;
        }

        try {
            // Get all files in workspace
            // Obtenir tous les fichiers dans l'espace de travail
            const files = await this.getWorkspaceFiles();

            this._view.webview.postMessage({
                type: 'projectFiles',
                files: files.slice(0, 50) // Limit to 50 files initially
            });
        } catch (error) {
            console.error('Error getting project files:', error);
        }
    }

    /**
     * Handle file search
     * Gérer la recherche de fichiers
     */
    private async handleSearchFiles(query: string) {
        if (!this._view) {
            return;
        }

        try {
            const files = await this.getWorkspaceFiles();
            const filteredFiles = files.filter(file =>
                file.toLowerCase().includes(query.toLowerCase())
            );

            this._view.webview.postMessage({
                type: 'fileSearchResults',
                files: filteredFiles.slice(0, 20) // Limit to 20 results
            });
        } catch (error) {
            console.error('Error searching files:', error);
        }
    }

    /**
     * Get workspace files
     * Obtenir les fichiers de l'espace de travail
     */
    private async getWorkspaceFiles(): Promise<string[]> {
        const files: string[] = [];

        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                const pattern = new vscode.RelativePattern(folder, '**/*');
                const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

                for (const uri of uris) {
                    const relativePath = vscode.workspace.asRelativePath(uri);
                    files.push(relativePath);
                }
            }
        }

        return files.sort();
    }

    /**
     * Get HTML for webview - React version
     * Obtenir le HTML pour la webview - Version React
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get the React bundle
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'command-bar.bundle.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'css', 'index.css'));

        // Use a nonce to only allow specific scripts to be run
        // Utiliser un nonce pour n'autoriser que des scripts spécifiques à s'exécuter
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} https: data:;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>AI Command Bar</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    /**
     * Save metrics to persistent storage
     * Sauvegarder les métriques dans le stockage persistant
     */
    private async handleSaveMetrics(metrics: any) {
        await this.context.globalState.update('sessionMetrics', metrics);
    }

    /**
     * Load metrics from persistent storage
     * Charger les métriques depuis le stockage persistant
     */
    private async handleLoadMetrics() {
        if (this._view) {
            const savedMetrics = this.context.globalState.get('sessionMetrics');

            // Charger les informations de build
            let buildInfo = { buildTimestamp: null, version: null };
            try {
                const buildInfoPath = require('path').join(__dirname, '..', '..', '..', 'build-info.json');
                const fs = require('fs');
                if (fs.existsSync(buildInfoPath)) {
                    buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
                }
            } catch (error) {
                console.warn('Impossible de charger les informations de build:', error instanceof Error ? error.message : String(error));
            }

            this._view.webview.postMessage({
                type: 'metricsLoaded',
                metrics: {
                    ...(savedMetrics || {
                        totalCost: 0,
                        totalTokens: 0,
                        latestLatency: 0,
                        cacheHits: 0,
                        totalRequests: 0
                    }),
                    buildTimestamp: buildInfo.buildTimestamp,
                    version: buildInfo.version
                }
            });
        }
    }

    /**
     * Handle code accept/reject actions from webview
     */
    private async handleCodeAction(data: { action: 'accept' | 'reject', file?: string, content: string, language?: string, isDiff?: boolean }) {
        try {
            const file = data.file?.trim();

            if (data.action === 'reject') {
                vscode.window.showInformationMessage('Changes rejected' + (file ? ` for ${file}` : ''));
                return;
            }

            // Accept
            if (data.isDiff) {
                await this.applyUnifiedDiff(data.content, file);
                vscode.window.showInformationMessage('Diff applied' + (file ? ` to ${file}` : ''));
            } else if (file) {
                await this.writeFileToWorkspace(file, data.content);
                vscode.window.showInformationMessage(`File updated: ${file}`);
            } else {
                vscode.window.showWarningMessage('No target file specified; cannot apply changes.');
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to apply changes: ${err?.message || err}`);
        }
    }

    private async writeFileToWorkspace(relativePath: string, content: string) {
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder) throw new Error('No workspace folder open');
        const uri = vscode.Uri.joinPath(folder.uri, relativePath);
        const enc = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, enc.encode(content));
    }

    // Minimal unified diff applier (adds lines starting with +, removes -). Context lines are ignored.
    private async applyUnifiedDiff(diffText: string, relativePath?: string) {
        // Try to detect file from diff header if not provided
        let target = relativePath;
        const fileMatch = diffText.match(/^\+\+\+\s+[ab/]*([^\n]+)|^diff --git a\/([^\n]+) b\/([^\n]+)/m);
        if (!target && fileMatch) {
            target = fileMatch[1] || fileMatch[2] || fileMatch[3];
        }
        if (!target) throw new Error('Target file not specified in diff');

        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!folder) throw new Error('No workspace folder open');
        const uri = vscode.Uri.joinPath(folder.uri, target);

        // Read current content
        let current = '';
        try {
            const buf = await vscode.workspace.fs.readFile(uri);
            current = new TextDecoder().decode(buf);
        } catch {
            // If file does not exist, we will create it from added lines
            current = '';
        }

        // Very naive patch: apply line by line ignoring hunk headers
        const lines = current.split(/\r?\n/);
        const result: string[] = [];
        let i = 0;
        const diffLines = diffText.split(/\r?\n/);
        for (const dl of diffLines) {
            if (dl.startsWith('+++') || dl.startsWith('---') || dl.startsWith('@@') || dl.startsWith('diff ')) {
                continue;
            }
            if (dl.startsWith('+')) {
                result.push(dl.slice(1));
            } else if (dl.startsWith('-')) {
                // remove a line from current if available (advance pointer)
                i++; // skip one from original
            } else {
                // context line: take from current when possible, else from dl
                if (i < lines.length) {
                    const existing = lines[i];
                    if (existing !== undefined) {
                        result.push(existing);
                    }
                    i++;
                } else {
                    result.push(dl);
                }
            }
        }
        // Append remaining original lines
        while (i < lines.length) {
            const tail = lines[i++];
            if (tail !== undefined) {
                result.push(tail);
            }
        }

        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(result.join('\n')));
    }

    /**
     * Handle provider models checking
     * Gérer la vérification des modèles du fournisseur
     */
    private async handleCheckProviderModels(provider: string, messageId: string) {
        try {
            const models = await this.modelChecker.checkProviderModels(provider);

            if (this._view) {
                this._view.webview.postMessage({
                    type: 'apiModelsResponse',
                    messageId: messageId,
                    success: true,
                    models: models
                });
            }
        } catch (error) {
            console.error(`Error checking models for ${provider}:`, error);

            if (this._view) {
                this._view.webview.postMessage({
                    type: 'apiModelsResponse',
                    messageId: messageId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    /**
     * Handle get models request from webview
     * Gérer la demande de récupération des modèles depuis la webview
     */
    private async handleGetModels(provider: string) {
        try {
            const models = await this.modelChecker.checkProviderModels(provider);

            if (this._view) {
                this._view.webview.postMessage({
                    type: 'modelsLoaded',
                    provider: provider,
                    models: models
                });
            }
        } catch (error) {
            console.error(`❌ [COMMAND-BAR] Error getting models for ${provider}:`, error);

            if (this._view) {
                this._view.webview.postMessage({
                    type: 'modelsError',
                    provider: provider,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    /**
     * Handle get providers status request from webview
     * Gérer la demande de récupération du statut des providers depuis la webview
     */
    private async handleGetProvidersStatus() {
        console.log('========== HANDLE GET PROVIDERS STATUS ==========');
        console.log('WebView available:', !!this._view);
        console.log('=================================================');

        try {
            console.log('📡 [COMMAND-BAR] Starting providers status check');
            const providers = await this.providerManager.getAllProviders();
            console.log(`✅ [COMMAND-BAR] Providers retrieved: ${providers.length} providers`);

            if (providers.length > 0) {
                console.log('📋 [COMMAND-BAR] Retrieved providers:');
                providers.forEach(provider => {
                    console.log(`   - ${provider.name} (${provider.id}) - Enabled: ${provider.enabled}, API Key: ${provider.apiKeyConfigured}`);
                });
            }

            if (this._view) {
                console.log('📤 [COMMAND-BAR] Sending providers to webview');
                this._view.webview.postMessage({
                    type: 'providersStatus',
                    providers: providers
                });
                console.log('📨 [COMMAND-BAR] Providers message sent to webview');
            } else {
                console.warn('❌ [COMMAND-BAR] No webview available to send providers');
            }
        } catch (error) {
            console.error('❌ [COMMAND-BAR] Error getting providers status:', error);

            if (this._view) {
                console.log('📤 [COMMAND-BAR] Sending error to webview');
                this._view.webview.postMessage({
                    type: 'providersError',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    /**
     * Dispose the provider
     * Libérer le fournisseur
     */
    public dispose(): void {
        // Clean up resources if needed
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}