const vscode = require('vscode');

function activate(context) {
    console.log('AI Developer Analytics extension is now active!');
    
    // Créer un fournisseur de vue simple
    const provider = {
        resolveWebviewView(webviewView, context, _token) {
            console.log('Resolving webview view for ai-command-bar');
            
            // Configuration du webview
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
            };
            
            // Contenu HTML simple
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
            padding: 16px;
            height: 100vh;
            overflow: hidden;
        }
        
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #1a1a1d;
            border-radius: 8px;
            padding: 16px;
        }
        
        .config-section {
            margin-bottom: 16px;
        }
        
        .mode-selector {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .mode-btn {
            padding: 8px 16px;
            border: 1px solid #3a3a3f;
            background: #2a2a2f;
            color: #ffffff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .mode-btn.active {
            background: #5cb6ff;
            border-color: #5cb6ff;
        }
        
        .dropdowns {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .dropdown {
            flex: 1;
            padding: 6px 12px;
            border: 1px solid #3a3a3f;
            background: #2a2a2f;
            color: #ffffff;
            border-radius: 6px;
            font-size: 12px;
        }
        
        .input-section {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .text-input {
            flex: 1;
            padding: 12px;
            border: 1px solid #3a3a3f;
            background: #2a2a2f;
            color: #ffffff;
            border-radius: 6px;
            font-size: 14px;
            resize: none;
            min-height: 40px;
        }
        
        .send-btn {
            padding: 12px 16px;
            background: #5cb6ff;
            border: none;
            color: #ffffff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .save-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            color: #666666;
            font-size: 16px;
            cursor: pointer;
            padding: 8px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <button class="save-btn" id="save-btn" title="Sauvegarder">●</button>
        
        <div class="config-section">
            <div class="mode-selector">
                <button class="mode-btn" data-mode="manual">Manual</button>
                <button class="mode-btn active" data-mode="auto">Auto</button>
            </div>
            
            <div class="dropdowns" id="auto-dropdowns">
                <select class="dropdown" id="task-select">
                    <option value="general">General</option>
                    <option value="code">Code</option>
                    <option value="documentation">Documentation</option>
                    <option value="debug">Debug</option>
                </select>
                <select class="dropdown" id="routing-mode">
                    <option value="eco">Eco</option>
                    <option value="normal">Normal</option>
                    <option value="quality">Quality</option>
                    <option value="strict-json">Strict JSON</option>
                    <option value="creative">Creative</option>
                </select>
            </div>
            
            <div class="dropdowns" id="manual-dropdowns" style="display: none;">
                <select class="dropdown" id="provider">
                    <option>OpenAI</option>
                    <option>Anthropic</option>
                    <option>DeepSeek</option>
                    <option>Moonshot</option>
                    <option>Ollama</option>
                </select>
                <select class="dropdown" id="model">
                    <option>GPT-4</option>
                    <option>GPT-3.5</option>
                    <option>Claude-3</option>
                    <option>Claude-2</option>
                </select>
            </div>
        </div>
        
        <div class="input-section">
            <textarea class="text-input" id="prompt-input" placeholder="Pose ta question..."></textarea>
            <button class="send-btn" id="send-btn">Envoyer</button>
        </div>
    </div>
    
    <script>
        // Gestion des modes
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.dataset.mode;
                if (mode === 'auto') {
                    document.getElementById('auto-dropdowns').style.display = 'flex';
                    document.getElementById('manual-dropdowns').style.display = 'none';
                } else {
                    document.getElementById('auto-dropdowns').style.display = 'none';
                    document.getElementById('manual-dropdowns').style.display = 'flex';
                }
            });
        });
        
        // Gestion du bouton de sauvegarde
        document.getElementById('save-btn').addEventListener('click', () => {
            const btn = document.getElementById('save-btn');
            btn.textContent = '✓';
            btn.style.color = '#4CAF50';
            setTimeout(() => {
                btn.textContent = '●';
                btn.style.color = '#666666';
            }, 1000);
        });
        
        // Gestion de l'envoi
        document.getElementById('send-btn').addEventListener('click', () => {
            const input = document.getElementById('prompt-input');
            if (input.value.trim()) {
                console.log('Message envoyé:', input.value);
                input.value = '';
            }
        });
        
        // Envoi avec Enter
        document.getElementById('prompt-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('send-btn').click();
            }
        });
    </script>
</body>
</html>`;
            
            // Gestion des messages
            webviewView.webview.onDidReceiveMessage(
                message => {
                    console.log('Message reçu:', message);
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