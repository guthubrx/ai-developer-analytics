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
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };

        const html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.html = html;
        console.log('WebView HTML loaded, checking for file-autocomplete...');
        console.log('HTML contains file-autocomplete:', html.includes('file-autocomplete'));

        // Reset any stuck loading states
        this._view.webview.postMessage({
            type: 'resetLoadingState'
        });

        webviewView.webview.onDidReceiveMessage(
            async data => {
                switch (data.type) {
                    case 'executePrompt':
                        await this.handleExecutePrompt(data.prompt, data.routingMode, data.provider, data.conversationContext);
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
        conversationContext?: any[]
    ) {
        if (!this._view) {
            return;
        }

        try {
            this._view.webview.postMessage({
                type: 'executionStarted',
                prompt
            });

            // Create a streaming response element in the UI
            this._view.webview.postMessage({
                type: 'streamingStarted'
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

            // Execute with real streaming and conversation context
            await this.aiRouter.executeWithStreaming(prompt, routingMode, provider, streamingCallback, conversationContext);

        } catch (error) {
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
     * Get HTML for webview - Mockup version
     * Obtenir le HTML pour la webview - Version Mockup
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        // Obtenir le chemin local vers le script principal exécuté dans la webview, puis le convertir en uri utilisable dans la webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.bundle.js'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'css', 'main.css'));

        // Pre-generate logo URIs for provider icons
        const logoUris = {
            openai: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logos', 'openai-logo.png')),
            anthropic: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logos', 'anthropic-logo.png')),
            deepseek: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logos', 'deepseek-logo.png')),
            moonshot: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logos', 'moonshot-logo.png')),
            ollama: webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'logos', 'ollama-logo.png'))
        };

        // Use a nonce to only allow specific scripts to be run
        // Utiliser un nonce pour n'autoriser que des scripts spécifiques à s'exécuter
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} https: data:;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>AI Command Bar</title>
            </head>
            <body>
                <div class="chat-bar">
                    <!-- Loading indicator -->
                    <div id="loading-indicator" style="display: none; text-align: center; padding: 20px;">
                        <div style="color: #007acc; font-size: 14px;">Chargement de l'interface...</div>
                    </div>

                    <!-- Main content -->
                    <div id="main-content" style="display: none;">
                        <!-- Onglets de sessions -->
                        <div class="tabs" id="tabs">
                            <div class="tab active" draggable="true" data-session="s1">Session 1</div>
                            <div class="tab" draggable="true" data-session="s2">Session 2</div>
                            <button class="new-session-btn" id="new-session-btn" title="Nouvelle session">+</button>
                        </div>

                        <!-- Zone de messages qui prend l'espace restant -->
                        <div class="conversation-container" id="conversation-container">
                            <div class="chat-messages" id="chatMessages">
                                <div id="conversation-content" class="conversation-content">
                                    <!-- Messages will be dynamically added here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Zone de saisie fixée en bas -->
                    <div class="fixed-bottom-container">
                        <div class="chat-input">
                            <div class="chat-config">
                                <!-- Tous les dropdowns dans le même container -->
                                <div class="all-dropdowns-container">
                                    <div class="dropdown-wrapper mode-dropdown">
                                        <span class="dropdown-icon-left">⚙</span>
                                        <select id="mode-select">
                                            <option value="manual">Manual Mode</option>
                                            <option value="auto">Auto Mode</option>
                                        </select>
                                        <span class="dropdown-icon-right">▼</span>
                                    </div>

                                    <!-- Dropdowns pour Manual Mode -->
                                    <div class="manual-mode-dropdowns" id="manual-mode-dropdowns" style="display: none;">
                                        <div class="dropdown-wrapper">
                                            <span class="dropdown-icon-left">◉</span>
                                            <select id="provider">
                                                <option>OpenAI</option>
                                                <option>Anthropic</option>
                                                <option>DeepSeek</option>
                                                <option>Moonshot</option>
                                                <option>Ollama</option>
                                            </select>
                                            <span class="dropdown-icon-right">▼</span>
                                        </div>
                                        <div class="dropdown-wrapper">
                                            <span class="dropdown-icon-left">🤖</span>
                                            <select id="model"></select>
                                            <span class="dropdown-icon-right">▼</span>
                                        </div>
                                    </div>

                                    <!-- Dropdowns pour Auto Mode -->
                                    <div class="auto-mode-dropdowns" id="auto-mode-dropdowns">
                                        <div class="dropdown-wrapper">
                                            <span class="dropdown-icon-left">◯</span>
                                            <select id="task-select">
                                                <option value="general">General</option>
                                                <option value="code">Code</option>
                                                <option value="documentation">Documentation</option>
                                                <option value="debug">Debug</option>
                                            </select>
                                            <span class="dropdown-icon-right">▼</span>
                                        </div>
                                        <div class="dropdown-wrapper">
                                            <span class="dropdown-icon-left">◐</span>
                                            <select id="routing-mode">
                                                <option value="eco">Eco</option>
                                                <option value="normal">Normal</option>
                                                <option value="quality">Quality</option>
                                                <option value="strict-json">Strict JSON</option>
                                                <option value="creative">Creative</option>
                                            </select>
                                            <span class="dropdown-icon-right">▼</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Bouton de sauvegarde à droite -->
                                <div class="save-config-container">
                                    <button class="save-config-btn" id="save-config-btn" title="Sauvegarder la configuration">
                                    </button>
                                </div>
                            </div>
                            <div class="chat-entry">
                                <textarea id="prompt-input" placeholder="Pose ta question…"></textarea>
                                <button id="send-btn">⏎</button>
                            </div>
                        </div>
                        <div class="chat-status">
                            <span id="context-tokens">0 tokens</span> •
                            <span id="cost-info">$0.00</span> •
                            <span id="tokens-info">0</span> •
                            <span id="latency-info">0s</span>
                        </div>
                    </div>
                    
                    <!-- Notification toast -->
                    <div class="notification-toast" id="notification-toast">
                        <span class="notification-message" id="notification-message"></span>
                        </div>
                    </div>
                </div>

                <script nonce="${nonce}">
                    // Show loading indicator initially
                    document.getElementById('loading-indicator').style.display = 'block';

                    // Wait for DOM to be ready
                    document.addEventListener('DOMContentLoaded', function() {
                        // Hide loading indicator and show main content
                        setTimeout(() => {
                            document.getElementById('loading-indicator').style.display = 'none';
                            document.getElementById('main-content').style.display = 'block';

                            // Notify extension that webview is ready
                            if (window.acquireVsCodeApi) {
                                const vscode = acquireVsCodeApi();
                                vscode.postMessage({
                                    type: 'webviewReady'
                                });
                            }
                        }, 100);
                    });

                    window.logoUris = ${JSON.stringify(logoUris)};
                </script>
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
            this._view.webview.postMessage({
                type: 'metricsLoaded',
                metrics: savedMetrics || {
                    totalCost: 0,
                    totalTokens: 0,
                    latestLatency: 0,
                    cacheHits: 0,
                    totalRequests: 0
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
        const fileMatch = diffText.match(/^\+\+\+\s+[ab\/]*([^\n]+)|^diff --git a\/([^\n]+) b\/([^\n]+)/m);
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
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}