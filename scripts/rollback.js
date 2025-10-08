#!/usr/bin/env node

/**
 * Script de rollback pour AI Developer Analytics
 * Permet de restaurer une version précédente en cas de problème
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Script de rollback AI Developer Analytics\n');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || error.stderr 
    };
  }
}

function listAvailableBackups() {
  log('📋 Sauvegardes disponibles:', 'blue');
  
  if (!fs.existsSync('backups')) {
    log('  ❌ Aucun dossier de sauvegarde trouvé', 'red');
    return [];
  }
  
  const backups = fs.readdirSync('backups')
    .filter(item => {
      const itemPath = path.join('backups', item);
      return fs.statSync(itemPath).isDirectory() && item.startsWith('build-');
    })
    .sort()
    .reverse(); // Plus récent en premier
  
  if (backups.length === 0) {
    log('  ❌ Aucune sauvegarde trouvée', 'red');
    return [];
  }
  
  backups.forEach((backup, index) => {
    const backupPath = path.join('backups', backup);
    const stats = fs.statSync(backupPath);
    const date = stats.mtime.toLocaleString('fr-FR');
    log(`  ${index + 1}. ${backup} (${date})`, 'cyan');
  });
  
  return backups;
}

function restoreFromBackup(backupName) {
  log(`🔄 Restauration depuis ${backupName}...`, 'blue');
  
  const backupPath = path.join('backups', backupName);
  
  if (!fs.existsSync(backupPath)) {
    log(`  ❌ Sauvegarde ${backupName} non trouvée`, 'red');
    return false;
  }
  
  const restoreCommands = [
    // Restaurer les fichiers compilés
    `cp -r ${backupPath}/out/* out/ 2>/dev/null || true`,
    `cp -r ${backupPath}/media/main.bundle.js media/ 2>/dev/null || true`,
    `cp -r ${backupPath}/server-mcp/dist/* server-mcp/dist/ 2>/dev/null || true`,
    
    // Restaurer les packages VSIX
    `cp ${backupPath}/*.vsix . 2>/dev/null || true`
  ];
  
  let allSuccess = true;
  
  for (const cmd of restoreCommands) {
    log(`  🔧 ${cmd}`, 'cyan');
    const result = execCommand(cmd);
    if (result.success) {
      log(`  ✅ Restauration réussie`, 'green');
    } else {
      log(`  ⚠️ Avertissement: ${result.error}`, 'yellow');
      // Ne pas échouer pour les fichiers optionnels
    }
  }
  
  return allSuccess;
}

function createEmergencyBackup() {
  log('💾 Création d\'une sauvegarde d\'urgence...', 'blue');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const emergencyBackup = `backups/emergency-${timestamp}`;
  
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  
  if (!fs.existsSync(emergencyBackup)) {
    fs.mkdirSync(emergencyBackup, { recursive: true });
  }
  
  const backupCommands = [
    `cp -r out/ ${emergencyBackup}/ 2>/dev/null || true`,
    `cp -r media/main.bundle.js ${emergencyBackup}/ 2>/dev/null || true`,
    `cp -r server-mcp/dist/ ${emergencyBackup}/ 2>/dev/null || true`,
    `cp *.vsix ${emergencyBackup}/ 2>/dev/null || true`
  ];
  
  for (const cmd of backupCommands) {
    execCommand(cmd);
  }
  
  log(`  ✅ Sauvegarde d'urgence créée: ${emergencyBackup}`, 'green');
  return emergencyBackup;
}

function rollbackToGitCommit(commitHash) {
  log(`🔄 Rollback vers le commit Git ${commitHash}...`, 'blue');
  
  const gitCommands = [
    `git stash push -m "Rollback backup ${new Date().toISOString()}"`,
    `git checkout ${commitHash}`,
    `git checkout -b rollback-${commitHash.slice(0, 7)}`
  ];
  
  let allSuccess = true;
  
  for (const cmd of gitCommands) {
    log(`  🔧 ${cmd}`, 'cyan');
    const result = execCommand(cmd);
    if (result.success) {
      log(`  ✅ ${cmd} - Réussi`, 'green');
    } else {
      log(`  ❌ ${cmd} - Échec: ${result.error}`, 'red');
      allSuccess = false;
    }
  }
  
  return allSuccess;
}

function listGitCommits() {
  log('📋 Commits Git récents:', 'blue');
  
  const result = execCommand('git log --oneline -10');
  if (result.success) {
    const commits = result.output.trim().split('\n');
    commits.forEach((commit, index) => {
      log(`  ${index + 1}. ${commit}`, 'cyan');
    });
    return commits;
  } else {
    log('  ❌ Impossible de récupérer l\'historique Git', 'red');
    return [];
  }
}

function validateRollback() {
  log('🔍 Validation du rollback...', 'blue');
  
  const validationChecks = [
    'out/extension.js',
    'media/main.bundle.js',
    'server-mcp/dist/index.js'
  ];
  
  let allValid = true;
  
  for (const file of validationChecks) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(1);
      log(`  ✅ ${file} (${sizeKB} KB)`, 'green');
    } else {
      log(`  ❌ ${file} - MANQUANT`, 'red');
      allValid = false;
    }
  }
  
  return allValid;
}

function showRollbackOptions() {
  log('\n🔄 Options de rollback disponibles:', 'bold');
  log('  1. Restaurer depuis une sauvegarde', 'yellow');
  log('  2. Rollback vers un commit Git', 'yellow');
  log('  3. Créer une sauvegarde d\'urgence', 'yellow');
  log('  4. Valider l\'état actuel', 'yellow');
  log('  5. Quitter', 'yellow');
}

// Fonction principale
async function runRollback() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      showRollbackOptions();
      return;
    }
    
    const command = args[0];
    
    switch (command) {
      case 'list':
        listAvailableBackups();
        break;
        
      case 'restore':
        if (args.length < 2) {
          log('❌ Usage: node scripts/rollback.js restore <backup-name>', 'red');
          return;
        }
        const backupName = args[1];
        if (restoreFromBackup(backupName)) {
          log('✅ Restauration réussie', 'green');
          validateRollback();
        } else {
          log('❌ Échec de la restauration', 'red');
        }
        break;
        
      case 'git':
        if (args.length < 2) {
          log('❌ Usage: node scripts/rollback.js git <commit-hash>', 'red');
          return;
        }
        const commitHash = args[1];
        if (rollbackToGitCommit(commitHash)) {
          log('✅ Rollback Git réussi', 'green');
        } else {
          log('❌ Échec du rollback Git', 'red');
        }
        break;
        
      case 'emergency':
        const emergencyBackup = createEmergencyBackup();
        log(`✅ Sauvegarde d'urgence créée: ${emergencyBackup}`, 'green');
        break;
        
      case 'validate':
        if (validateRollback()) {
          log('✅ État actuel valide', 'green');
        } else {
          log('❌ État actuel invalide', 'red');
        }
        break;
        
      case 'commits':
        listGitCommits();
        break;
        
      default:
        log('❌ Commande inconnue', 'red');
        showRollbackOptions();
    }
    
  } catch (error) {
    log(`\n💥 ERREUR: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  log('\n⚠️ Rollback interrompu', 'yellow');
  process.exit(1);
});

// Exécution
runRollback();