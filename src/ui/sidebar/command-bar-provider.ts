/**
 * AI Command Bar WebView Provider
 * Fournisseur WebView de la barre de commande IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIRouter } from '../../ai/router/router';
import { AnalyticsManager } from '../../analytics/manager';
import { AICoach } from '../../coaching/coach';
import { SessionManager } from '../../sessions/manager';
import { AIRoutingMode, AIProvider, StreamingCallback } from '../../ai/types';

/**
 * AI Command Bar WebView Provider
 * Fournisseur WebView de la barre de commande IA
 */
export class AICommandBarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai-command-bar';

    private _view?: vscode.WebviewView;
    private readonly extensionUri: vscode.Uri;
    private readonly aiRouter: AIRouter;
    private readonly aiCoach: AICoach;
    private readonly sessionManager: SessionManager;
    private readonly context: vscode.ExtensionContext;

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

        // Send initial settings when webview is loaded
        this.handleGetSettings();

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
     * Get HTML for webview
     * Obtenir le HTML pour la webview
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
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <link href="${styleMainUri}" rel="stylesheet">

                <title>AI Command Bar</title>
            </head>
            <body>
                <div class="ai-command-bar">
                    <div class="header-section">
                        <div class="super-title">CURSOR DEVELOPER ANALYTICS</div>
                        <button id="settings-btn" class="action-btn" title="Open Settings">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z"/>
                                <path d="M14 8c0-.4-.1-.8-.2-1.2l1.8-1.2-1-1.7-2 .3c-.5-.4-1-.7-1.6-.9L10 1H6l-.4 2.1c-.6.2-1.1.5-1.6.9l-2-.3-1 1.7 1.8 1.2c-.1.4-.2.8-.2 1.2s.1.8.2 1.2L1.4 11.3l1 1.7 2-.3c.5.4 1 .7 1.6.9L6 15h4l.4-2.1c.6-.2 1.1-.5 1.6-.9l2 .3 1-1.7-1.8-1.2c.1-.4.2-.8.2-1.2z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Les dropdowns ont été déplacées vers la zone de commande -->

                    <!-- Conteneur de contenu principal -->
                    <div class="main-content">
                        <!-- Barre d'onglets des sessions -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">
                                    <svg class="card-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M2 3h12c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1z"/>
                                        <path d="M4 6h8M4 8h6M4 10h4"/>
                                    </svg>
                                    Sessions
                                </div>
                            </div>
                            <div class="session-tabs-container">
                                <div class="session-tabs" id="session-tabs">
                                    <!-- Les onglets seront générés dynamiquement -->
                                </div>
                                <button class="action-btn" id="new-session-btn" title="New Session">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Zone de conversation moderne -->
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">
                                    <svg class="card-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"/>
                                        <path d="M8 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z"/>
                                        <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z"/>
                                    </svg>
                                    Conversation
                                </div>
                            </div>
                            <div class="conversation-container" id="conversation-container">
                                <div id="conversation-content" class="conversation-content"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Zone fixe en bas : Coach + Zone de saisie -->
                    <div class="fixed-bottom-container">
                        <!-- Coach Advice avec collapse -->
                        <div class="coaching-section collapsed" id="coaching-section">
                            <div class="coaching-header">
                                <span>AI Coach Advice</span>
                                <button id="coach-collapse-btn" class="collapse-btn">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                        <path d="M1 4L6 9L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                            </div>
                            <div id="coaching-content" class="coaching-content"></div>
                        </div>

                        <!-- Context Size Info Bar -->
                        <div class="context-info-bar" id="context-info-bar">
                            <span class="context-label">Context Size:</span>
                            <span id="context-tokens" class="context-value">0 tokens</span>
                        </div>

                        <!-- Barre de commande compacte -->
                        <div class="card command-input-container">
                            <div class="command-input-wrapper">
                                <!-- Conteneur pour toutes les dropdowns côte à côte -->
                                <div class="controls-row">
                                    <div class="control-group">
                                        <!-- Bouton @ pour les fichiers -->
                                        <button id="file-attach-btn" class="action-btn" title="Attach file">
                                            @
                                        </button>

                                        <!-- Dropdown Task (Code/Doc/Debug) -->
                                        <select id="task-select" class="compact-select" title="Task Type">
                                            <option value="general">General</option>
                                            <option value="code">Code</option>
                                            <option value="documentation">Documentation</option>
                                            <option value="debug">Debug</option>
                                        </select>

                                        <!-- Dropdown Mode (Eco/Quality) -->
                                        <select id="mode-select" class="compact-select" title="Mode">
                                            <option value="auto" selected>Auto</option>
                                            <option value="eco">Eco</option>
                                            <option value="normal">Normal</option>
                                            <option value="quality">Quality</option>
                                            <option value="strict-json">Strict JSON</option>
                                            <option value="creative">Creative</option>
                                        </select>

                                        <!-- Dropdown pour sélectionner le moteur AI -->
                                        <select id="engine-select" class="compact-select" title="AI Engine">
                                            <option value="auto">Auto</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic</option>
                                            <option value="deepseek" selected>DeepSeek</option>
                                            <option value="moonshot">Moonshot</option>
                                            <option value="ollama">Ollama</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Zone de texte auto-expansive -->
                                <div class="text-input-wrapper">
                                    <!-- Model selection -->
                                    <div id="model-selection-row" style="margin-bottom:6px; gap:6px; align-items:center;">
                                        <label style="font-size:11px; color: var(--vscode-descriptionForeground);">Modèles</label>
                                        <select id="model-suggestions" class="compact-select" title="Modèles">
                                            <option value="">Sélectionner un modèle</option>
                                        </select>
                                        <!-- Bouton pour ouvrir le sélecteur de modèles -->
                                        <button id="select-model-btn" class="action-btn" title="Sélectionner un modèle d\'IA" style="margin-left:4px;">
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <textarea id="prompt-input" placeholder="Ask anything..." rows="2"></textarea>
                                </div>

                                <!-- Actions en bas -->
                                <div class="input-actions">
                                    <button id="image-attach-btn" class="action-btn" title="Attach image">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M14.5 3h-13C.7 3 0 3.7 0 4.5v7c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-7c0-.8-.7-1.5-1.5-1.5zM1.5 4h13c.3 0 .5.2.5.5v4.8l-2.3-2.3c-.2-.2-.5-.2-.7 0L9 9.3 6.5 6.8c-.2-.2-.5-.2-.7 0L2 10.6V4.5c0-.3.2-.5.5-.5z"/>
                                        </svg>
                                    </button>
                                    <button id="send-btn" class="send-btn" title="Send message">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M15.7 7.3l-7-7c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4L7.6 7H1c-.6 0-1 .4-1 1s.4 1 1 1h6.6L7.3 14.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3s.5-.1.7-.3l7-7c.4-.4.4-1 0-1.4z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Métriques compactes -->
                            <div class="metrics-section">
                                <div class="metric-item">
                                    <span class="metric-label">Cost</span>
                                    <span id="cost-info" class="metric-value">$0.00</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Tokens</span>
                                    <span id="tokens-info" class="metric-value">0</span>
                                </div>
                                <div class="metric-item">
                                    <span id="latency-info" class="metric-value">0s</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Cache</span>
                                    <span id="cache-info" class="metric-value">0%</span>
                                </div>
                            </div>
                        </div>

                        <!-- File autocomplete -->
                        <div id="file-autocomplete" class="file-autocomplete" style="display: none;">
                            <input type="text" id="file-search" placeholder="Search files..." />
                            <div id="file-results" class="file-results"></div>
                        </div>
                    </div>
                    </div>
                </div>

                <script nonce="${nonce}">
                    // Pass logo URIs to JavaScript modules
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
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}