/**
 * AI Dashboard Provider
 * Fournisseur de tableau de bord IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AnalyticsManager } from '../../analytics/manager';
import { AICoach } from '../../coaching/coach';

export class AIDashboardProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai-dashboard';

    constructor(
        private readonly _extensionUri: vscode.Uri,
        _analyticsManager: AnalyticsManager,
        _aiCoach: AICoach
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            data => {
                switch (data.type) {
                    case 'refresh':
                        this._updateWebview(webviewView);
                        return;
                }
            },
            undefined
        );
    }

    private _getHtmlForWebview(_webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-eval';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Dashboard</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    .dashboard {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .metric {
                        background: var(--vscode-panel-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 16px;
                        margin-bottom: 16px;
                    }
                    .metric h3 {
                        margin-top: 0;
                        color: var(--vscode-titleBar-activeForeground);
                    }
                </style>
            </head>
            <body>
                <div class="dashboard">
                    <h1>AI Analytics Dashboard</h1>
                    <div class="metric">
                        <h3>Usage Statistics</h3>
                        <p>Dashboard coming soon...</p>
                    </div>
                    <div class="metric">
                        <h3>Performance Metrics</h3>
                        <p>Real-time metrics will be displayed here</p>
                    </div>
                    <div class="metric">
                        <h3>Cost Analysis</h3>
                        <p>Cost tracking and optimization suggestions</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private _updateWebview(webviewView: vscode.WebviewView) {
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    /**
     * Dispose the provider
     * Libérer le fournisseur
     */
    public dispose(): void {
        // Clean up any resources if needed
    }
}