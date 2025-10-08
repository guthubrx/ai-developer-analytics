/**
 * AI Coach Provider
 * Fournisseur de coach IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AICoach } from '../../coaching/coach';

export class AICoachProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai-coach';

    constructor(
        private readonly _extensionUri: vscode.Uri,
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
                    case 'getAdvice':
                        this._provideAdvice(webviewView, data.context);
                        return;
                }
            },
            undefined
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-eval';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Coach</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    .coach {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .advice {
                        background: var(--vscode-panel-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 16px;
                        margin-bottom: 16px;
                    }
                    .advice h3 {
                        margin-top: 0;
                        color: var(--vscode-titleBar-activeForeground);
                    }
                </style>
            </head>
            <body>
                <div class="coach">
                    <h1>AI Development Coach</h1>
                    <div class="advice">
                        <h3>Personalized Guidance</h3>
                        <p>Adaptive coaching based on your development patterns</p>
                        <button onclick="getAdvice()">Get Development Advice</button>
                    </div>
                    <div class="advice">
                        <h3>Best Practices</h3>
                        <p>AI-powered recommendations for code quality and efficiency</p>
                    </div>
                    <div class="advice">
                        <h3>Performance Tips</h3>
                        <p>Optimize your workflow with data-driven insights</p>
                    </div>
                </div>
                <script>
                    function getAdvice() {
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({
                            type: 'getAdvice',
                            context: 'development-patterns'
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    private async _provideAdvice(webviewView: vscode.WebviewView, context: string) {
        // This would integrate with the AICoach to provide personalized advice
        // For now, return a simple placeholder response
        const advice = `Coaching advice for: ${context}. This feature will provide personalized guidance based on your usage patterns.`;

        webviewView.webview.postMessage({
            type: 'advice',
            content: advice
        });
    }
}