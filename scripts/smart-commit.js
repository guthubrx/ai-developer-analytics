#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fonction pour exécuter une commande et capturer la sortie
function runCommand(command, description = '') {
    if (description) console.log(`📦 ${description}...`);
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return output.trim();
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        return null;
    }
}

// Fonction pour analyser les changements
function analyzeChanges() {
    console.log('🔍 Analyse des changements...');

    const status = runCommand('git status --porcelain');
    const stagedDiff = runCommand('git diff --staged --name-only');
    const unstagedDiff = runCommand('git diff --name-only');

    const changes = {
        added: [],
        modified: [],
        deleted: [],
        staged: stagedDiff ? stagedDiff.split('\n').filter(Boolean) : [],
        unstaged: unstagedDiff ? unstagedDiff.split('\n').filter(Boolean) : []
    };

    if (status) {
        status.split('\n').forEach(line => {
            if (line.trim()) {
                const statusChar = line[0];
                const file = line.slice(3);

                if (statusChar === 'A') changes.added.push(file);
                else if (statusChar === 'M') changes.modified.push(file);
                else if (statusChar === 'D') changes.deleted.push(file);
            }
        });
    }

    return changes;
}

// Fonction pour générer un message de commit intelligent
function generateCommitMessage(changes) {
    console.log('💡 Génération du message de commit...');

    const messages = [];

    // Analyser les types de changements
    const hasWebviewChanges = changes.staged.some(file => file.includes('webview/') || file.includes('command-bar'));
    const hasExtensionChanges = changes.staged.some(file => file.includes('src/') && !file.includes('webview/'));
    const hasConfigChanges = changes.staged.some(file => file.includes('package.json') || file.includes('tsconfig'));
    const hasScriptChanges = changes.staged.some(file => file.includes('scripts/'));
    const hasCSSChanges = changes.staged.some(file => file.endsWith('.css'));
    const hasTypeChanges = changes.staged.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));

    // Générer le message principal
    if (hasWebviewChanges) {
        if (hasCSSChanges) {
            messages.push('Amélioration de l\'interface utilisateur et styles');
        } else if (hasTypeChanges) {
            messages.push('Amélioration de la logique de l\'interface webview');
        } else {
            messages.push('Mise à jour de l\'interface webview');
        }
    }

    if (hasExtensionChanges) {
        messages.push('Amélioration de la logique de l\'extension');
    }

    if (hasConfigChanges) {
        messages.push('Mise à jour de la configuration');
    }

    if (hasScriptChanges) {
        messages.push('Amélioration des scripts de build/déploiement');
    }

    // Ajouter des détails spécifiques
    const details = [];

    if (changes.added.length > 0) {
        details.push(`Ajout de ${changes.added.length} fichier(s)`);
    }

    if (changes.modified.length > 0) {
        details.push(`Modification de ${changes.modified.length} fichier(s)`);
    }

    if (changes.deleted.length > 0) {
        details.push(`Suppression de ${changes.deleted.length} fichier(s)`);
    }

    // Construire le message final
    let commitMessage = messages.length > 0 ? messages.join(', ') : 'Mise à jour du code';

    if (details.length > 0) {
        commitMessage += `\n\n${details.join(', ')}`;
    }

    // Ajouter les fichiers principaux modifiés (limité à 5)
    const mainFiles = changes.staged.slice(0, 5);
    if (mainFiles.length > 0) {
        commitMessage += '\n\nFichiers principaux:';
        mainFiles.forEach(file => {
            commitMessage += `\n- ${file}`;
        });

        if (changes.staged.length > 5) {
            commitMessage += `\n- ... et ${changes.staged.length - 5} autres fichiers`;
        }
    }

    return commitMessage;
}

// Fonction principale
async function main() {
    console.log('🚀 Commit intelligent pour AI Developer Analytics');
    console.log('─'.repeat(50));

    // Vérifier que nous sommes dans un dépôt git
    try {
        runCommand('git status', 'Vérification du dépôt Git');
    } catch (error) {
        console.error('❌ Ce répertoire n\'est pas un dépôt Git');
        process.exit(1);
    }

    // Étape 1: Analyser les changements
    const changes = analyzeChanges();

    if (changes.staged.length === 0 && changes.unstaged.length === 0) {
        console.log('ℹ️  Aucun changement à commiter');
        return;
    }

    // Étape 2: Ajouter tous les fichiers
    console.log('📝 Ajout des fichiers...');
    runCommand('git add .');

    // Réanalyser après l'ajout
    const finalChanges = analyzeChanges();

    // Étape 3: Générer le message de commit
    const commitMessage = generateCommitMessage(finalChanges);

    console.log('\n📋 Message de commit généré:');
    console.log('─'.repeat(50));
    console.log(commitMessage);
    console.log('─'.repeat(50));

    // Étape 4: Exécuter le commit
    console.log('💾 Création du commit...');
    const tempFile = path.join(__dirname, 'temp-commit-message.txt');
    fs.writeFileSync(tempFile, commitMessage);

    try {
        runCommand(`git commit -F "${tempFile}"`, 'Exécution du commit');

        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempFile);

        // Étape 5: Afficher le résultat
        console.log('✅ Commit créé avec succès !');
        const lastCommit = runCommand('git log --oneline -1');
        console.log(`📝 Dernier commit: ${lastCommit}`);

    } catch (error) {
        console.error('❌ Erreur lors du commit');
        // Nettoyer le fichier temporaire en cas d'erreur
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        process.exit(1);
    }
}

// Exécuter le script
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});