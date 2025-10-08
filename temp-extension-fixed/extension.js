const vscode = require('vscode');

function activate(context) {
    console.log('AI Developer Analytics extension is now active!');
    
    // Créer un fournisseur de vue simple mais robuste
    const provider = {
        resolveWebviewView(webviewView, context, _token) {
            console.log('Resolving webview view for ai-command-bar');
            
            // Configuration du webview
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
            };
            
            // Charger le bundle principal
            const mainBundleUri = webviewView.webview.asWebviewUri(
                vscode.Uri.joinPath(context.extensionUri, 'media', 'main.bundle.js')
            );
            
            // Contenu HTML avec le bundle
            webviewView.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Command Bar</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
        }
        
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #1a1a1d;
        }
        
        .chat-input {
            padding: 16px;
            background: #1a1a1d;
            border-top: 1px solid #3a3a3f;
        }
        
        .chat-config {
            margin-bottom: 12px;
        }
        
        .config-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .save-config-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }
        
        .dropdown-wrapper {
            position: relative;
            background: #2a2a2f;
            border: 1px solid #3a3a3f;
            border-radius: 16px;
            padding: 0;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .dropdown-wrapper:hover {
            background: #3a3a3f;
        }
        
        .dropdown-wrapper:focus-within {
            background: #3a3a3f;
        }
        
        .dropdown-icon-left {
            position: absolute;
            left: 12px;
            color: #666666;
            font-size: 12px;
            font-weight: 400;
            opacity: 0.7;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        }
        
        .dropdown-icon-right {
            position: absolute;
            right: 12px;
            color: #666666;
            font-size: 10px;
            font-weight: 400;
            opacity: 0.7;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        }
        
        .dropdown-wrapper select {
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 12px;
            padding: 6px 32px 6px 24px;
            border-radius: 16px;
            height: 28px;
            width: 100%;
            appearance: none;
            cursor: pointer;
            outline: none;
        }
        
        .dropdown-wrapper select:focus {
            outline: none;
        }
        
        .mode-dropdown {
            background: #1a1a1d;
            border: 1px solid #3a3a3f;
            flex: 1;
        }
        
        .mode-dropdown:hover {
            background: #2a2a2f;
        }
        
        .mode-dropdown:focus-within {
            background: #2a2a2f;
        }
        
        .manual-mode-dropdowns,
        .auto-mode-dropdowns {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: nowrap;
            width: 100%;
        }
        
        .manual-mode-dropdowns {
            display: none;
        }
        
        .auto-mode-dropdowns {
            display: flex;
        }
        
        .save-config-btn {
            background: transparent;
            border: none;
            border-radius: 16px;
            color: #666666;
            padding: 6px 12px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 36px;
            height: 28px;
            outline: none;
            box-shadow: none;
        }
        
        .save-config-btn:hover {
            color: #ffffff;
        }
        
        .save-config-btn:active {
            color: #cccccc;
        }
        
        .save-config-btn:focus,
        .save-config-btn:focus-visible {
            outline: none;
            box-shadow: none;
            border: none;
        }
        
        .chat-entry {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .chat-entry textarea {
            flex: 1;
            background: #2a2a2f;
            border: 1px solid #3a3a3f;
            border-radius: 20px;
            color: #ffffff;
            padding: 12px 16px;
            font-size: 14px;
            resize: none;
            outline: none;
            min-height: 20px;
            max-height: 120px;
            font-family: inherit;
        }
        
        .chat-entry textarea:focus {
            border-color: #5cb6ff;
        }
        
        .chat-entry textarea::placeholder {
            color: #666666;
        }
        
        .chat-entry button {
            background: #5cb6ff;
            border: none;
            border-radius: 50%;
            color: #ffffff;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background-color 0.2s ease;
        }
        
        .chat-entry button:hover {
            background: #4a9eff;
        }
        
        .chat-entry button:active {
            background: #3a8eef;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-input">
            <div class="chat-config">
                <div class="config-header">
                    <div class="dropdown-wrapper mode-dropdown">
                        <span class="dropdown-icon-left">⚙</span>
                        <select id="mode-select">
                            <option value="manual">Manual Mode</option>
                            <option value="auto" selected>Auto Mode</option>
                        </select>
                        <span class="dropdown-icon-right">▼</span>
                    </div>
                </div>
                
                <!-- Dropdowns pour Manual Mode -->
                <div class="manual-mode-dropdowns" id="manual-mode-dropdowns">
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
                
                <!-- Bouton de sauvegarde à droite -->
                <div class="save-config-container">
                    <button class="save-config-btn" id="save-config-btn" title="Enregistrer la configuration">
                        ●
                    </button>
                </div>
            </div>
            <div class="chat-entry">
                <textarea id="prompt-input" placeholder="Pose ta question…"></textarea>
                <button id="send-btn">⏎</button>
            </div>
        </div>
    </div>
    
    <script src="${mainBundleUri}"></script>
</body>
</html>`;
            
            // Gestion des messages
            webviewView.webview.onDidReceiveMessage(
                message => {
                    console.log('Message reçu:', message);
                    switch (message.command) {
                        case 'checkProviderModels':
                            webviewView.webview.postMessage({
                                command: 'providerModelsChecked',
                                provider: message.provider,
                                models: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2']
                            });
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    };
    
    // Enregistrer le fournisseur de vue
    try {
        const disposable = vscode.window.registerWebviewViewProvider('ai-command-bar', provider);
        context.subscriptions.push(disposable);
        console.log('Webview provider enregistré avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du webview provider:', error);
    }
}

function deactivate() {
    console.log('AI Developer Analytics extension deactivated');
}

module.exports = {
    activate,
    deactivate
};