#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour exécuter une commande et capturer la sortie
function runCommand(command, description) {
    console.log(`📦 ${description}...`);
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        if (output) console.log(output.trim());
        return true;
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        if (error.stdout) console.log(error.stdout.toString().trim());
        if (error.stderr) console.error(error.stderr.toString().trim());
        return false;
    }
}

// Fonction principale
try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const version = packageJson.version;
    const timestamp = new Date().toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        hour12: false
    });

    console.log(`🚀 Déploiement de l'extension v${version}`);
    console.log(`⏰ Début: ${timestamp}`);
    console.log('─'.repeat(50));

    // Étape 1: Construction du VSIX
    if (!runCommand('npm run package', 'Construction du VSIX')) {
        process.exit(1);
    }

    // Étape 2: Désinstallation de l'ancienne version
    runCommand('code --uninstall-extension moi.ai-developer-analytics 2>/dev/null', 'Désinstallation de l\'ancienne version');

    // Étape 3: Installation de la nouvelle version
    const vsixFile = `ai-developer-analytics-${version}.vsix`;
    if (!runCommand(`code --install-extension ${vsixFile}`, 'Installation de la nouvelle version')) {
        process.exit(1);
    }

    // Étape 4: Sauvegarde du timestamp dans les métriques
    const buildInfo = {
        buildTimestamp: timestamp,
        version: version
    };

    try {
        const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
        fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
        console.log(`📝 Timestamp sauvegardé: ${buildInfoPath}`);
    } catch (error) {
        console.warn('⚠️ Impossible de sauvegarder le timestamp:', error.message);
    }

    // Étape 5: Instructions de rechargement
    console.log('─'.repeat(50));
    console.log(`✅ SUCCÈS: Extension v${version} déployée avec succès!`);
    console.log(`⏰ Déployé à: ${timestamp}`);
    console.log(`📦 Fichier: ${vsixFile}`);
    console.log('🔄 Rechargement requis pour activer la nouvelle version');
    console.log('');
    console.log('📋 Instructions rapides:');
    console.log('1. Ouvrez la palette de commandes (Cmd+Shift+P)');
    console.log('2. Tapez "Developer: Reload Window"');
    console.log('3. Entrez pour recharger VSCode');
    console.log('4. Le timestamp sera visible dans les métriques');
    console.log('');
    console.log('💡 Astuce: Utilisez le raccourci clavier:');
    console.log('   - Mac: Cmd+Shift+P puis "Developer: Reload Window"');
    console.log('   - Windows/Linux: Ctrl+Shift+P puis "Developer: Reload Window"');

} catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
}