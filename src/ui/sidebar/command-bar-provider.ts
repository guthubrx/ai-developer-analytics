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
import { AIRoutingMode, AIProvider } from '../../ai/types';

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

    constructor(
        extensionUri: vscode.Uri,
        aiRouter: AIRouter,
        _analyticsManager: AnalyticsManager,
        aiCoach: AICoach
    ) {
        this.extensionUri = extensionUri;
        this.aiRouter = aiRouter;
        this.aiCoach = aiCoach;
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

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async data => {
                switch (data.type) {
                    case 'executePrompt':
                        await this.handleExecutePrompt(data.prompt, data.routingMode, data.provider);
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
                    case 'searchFiles':
                        await this.handleSearchFiles(data.query);
                        break;
                    case 'showInformationMessage':
                        vscode.window.showInformationMessage(data.message);
                        break;
                }
            }
        );
    }

    /**
     * Handle prompt execution
     * Gérer l'exécution du prompt
     */
    private async handleExecutePrompt(
        prompt: string,
        routingMode: AIRoutingMode,
        provider?: AIProvider | 'auto'
    ) {
        if (!this._view) {
            return;
        }

        try {
            this._view.webview.postMessage({
                type: 'executionStarted',
                prompt
            });

            const response = await this.aiRouter.execute(prompt, routingMode, provider);

            this._view.webview.postMessage({
                type: 'executionCompleted',
                response: response.content,
                provider: response.provider,
                latency: response.latency,
                tokens: response.tokens,
                cost: response.cost,
                cacheHit: response.cacheHit
            });

            // Get coaching advice
            // Obtenir des conseils de coaching
            const advice = await this.aiCoach.getAdvice(prompt, response);
            if (advice) {
                this._view.webview.postMessage({
                    type: 'coachingAdvice',
                    advice
                });
            }

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
            fontSize: config.get('fontSize', 13)
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
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js'));
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css'));

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
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">

                <title>AI Command Bar</title>
            </head>
            <body>
                <div class="ai-command-bar">
                    <div class="header-section">
                        <div class="super-title">CURSOR DEVELOPER ANALYTICS</div>
                        <h1 class="main-title">AI Command Bar</h1>
                    </div>

                    <!-- Options compactes -->
                    <div class="compact-options">
                        <div class="option-group">
                            <select id="task-select" class="compact-select">
                                <option value="general">General</option>
                                <option value="code">Code</option>
                                <option value="documentation">Documentation</option>
                                <option value="debug">Debug</option>
                            </select>
                        </div>

                        <div class="option-group">
                            <select id="mode-select" class="compact-select">
                                <option value="auto" selected>Auto</option>
                                <option value="eco">Eco</option>
                                <option value="normal">Normal</option>
                                <option value="quality">Quality</option>
                                <option value="strict-json">Strict JSON</option>
                                <option value="creative">Creative</option>
                            </select>
                        </div>

                        <div class="provider-buttons compact" id="provider-buttons">
                            <button class="provider-btn active" data-provider="auto">Auto</button>
                            <button class="provider-btn" data-provider="openai">GPT-5</button>
                            <button class="provider-btn" data-provider="anthropic">Claude</button>
                            <button class="provider-btn" data-provider="deepseek">DeepSeek</button>
                        </div>
                    </div>

                    <!-- Zone de conversation WhatsApp -->
                    <div class="conversation-container" id="conversation-container">
                        <div id="conversation-content" class="conversation-content"></div>
                    </div>

                    <!-- Coach Advice avec collapse - COLLÉ À LA ZONE DE SAISIE -->
                    <div class="coaching-section" id="coaching-section" style="display: none;">
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

                    <!-- Barre de commande compacte style Cursor - PLACÉE EN BAS -->
                    <div class="command-input-container">
                        <div class="command-input-wrapper">
                            <!-- Bouton @ pour les fichiers -->
                            <div class="file-attach-button">
                                <button id="file-attach-btn" class="attach-btn" title="Attach file">
                                    @
                                </button>
                                <div id="file-autocomplete" class="file-autocomplete" style="display: none;">
                                    <input type="text" id="file-search" placeholder="Search files..." />
                                    <div id="file-results" class="file-results"></div>
                                </div>
                            </div>

                            <!-- Zone de texte auto-expansive -->
                            <div class="text-input-wrapper">
                                <textarea id="prompt-input" placeholder="Ask anything..." rows="2"></textarea>
                            </div>

                            <!-- Actions en bas -->
                            <div class="input-actions">
                                <button id="image-attach-btn" class="action-btn" title="Attach image">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M14.5 3h-13C.7 3 0 3.7 0 4.5v7c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-7c0-.8-.7-1.5-1.5-1.5zM1.5 4h13c.3 0 .5.2.5.5v4.8l-2.3-2.3c-.2-.2-.5-.2-.7 0L9 9.3 6.5 6.8c-.2-.2-.5-.2-.7 0L2 10.6V4.5c0-.3.2-.5.5-.5z"/>
                                    </svg>
                                </button>
                                <button id="send-btn" class="action-btn send-btn" title="Send message">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M15.7 7.3l-7-7c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4L7.6 7H1c-.6 0-1 .4-1 1s.4 1 1 1h6.6L7.3 14.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3s.5-.1.7-.3l7-7c.4-.4.4-1 0-1.4z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Métriques compactes - PLACÉES SOUS LA ZONE DE SAISIE -->
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
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
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