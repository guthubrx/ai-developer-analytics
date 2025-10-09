---
description: Mise à jour ultra-rapide de l'extension
allowed-tools: Bash
---
!npm run package && code --uninstall-extension moi.ai-developer-analytics 2>/dev/null; code --install-extension ai-developer-analytics-0.3.10.vsix && echo "✅ Extension mise à jour - Redémarrez VSCode"