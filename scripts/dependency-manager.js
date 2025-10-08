#!/usr/bin/env node

/**
 * Gestionnaire de dépendances sécurisé pour AI Developer Analytics
 * Vérifie, répare et met à jour les dépendances de manière sécurisée
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Gestionnaire de dépendances AI Developer Analytics\n');

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

// Dépendances critiques avec versions exactes
const CRITICAL_DEPENDENCIES = {
  '@types/vscode': '1.104.0',
  'typescript': '5.5.0',
  'tsup': '8.5.0',
  'vsce': 'latest',
  '@types/node': '20.x',
  'eslint': '9.0.0'
};

// Dépendances de production
const PRODUCTION_DEPENDENCIES = {
  '@anthropic-ai/sdk': '^0.25.0',
  'axios': '^1.12.2',
  'crypto-js': '^4.2.0',
  'lru-cache': '^10.0.0',
  'openai': '^4.0.0',
  'sql.js': '^1.13.0'
};

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

function checkNodeVersion() {
  log('🟢 Vérification de la version Node.js...', 'blue');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    log(`  ✅ Node.js ${nodeVersion} (compatible)`, 'green');
    return true;
  } else {
    log(`  ❌ Node.js ${nodeVersion} (minimum 18 requis)`, 'red');
    return false;
  }
}

function checkNPMVersion() {
  log('📦 Vérification de la version NPM...', 'blue');
  
  const result = execCommand('npm --version');
  if (result.success) {
    const version = result.output.trim();
    log(`  ✅ NPM ${version}`, 'green');
    return true;
  } else {
    log('  ❌ NPM non trouvé', 'red');
    return false;
  }
}

function analyzeCurrentDependencies() {
  log('🔍 Analyse des dépendances actuelles...', 'blue');
  
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    log('  ❌ package.json non trouvé', 'red');
    return null;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const analysis = {
    devDependencies: packageJson.devDependencies || {},
    dependencies: packageJson.dependencies || {},
    missing: [],
    outdated: [],
    conflicts: []
  };
  
  // Vérifier les dépendances critiques
  for (const [dep, expectedVersion] of Object.entries(CRITICAL_DEPENDENCIES)) {
    const currentVersion = analysis.devDependencies[dep];
    if (!currentVersion) {
      analysis.missing.push({ dep, expectedVersion, type: 'dev' });
      log(`  ❌ ${dep} - MANQUANT`, 'red');
    } else {
      log(`  ✅ ${dep}: ${currentVersion}`, 'green');
    }
  }
  
  // Vérifier les dépendances de production
  for (const [dep, expectedVersion] of Object.entries(PRODUCTION_DEPENDENCIES)) {
    const currentVersion = analysis.dependencies[dep];
    if (!currentVersion) {
      analysis.missing.push({ dep, expectedVersion, type: 'prod' });
      log(`  ❌ ${dep} - MANQUANT`, 'red');
    } else {
      log(`  ✅ ${dep}: ${currentVersion}`, 'green');
    }
  }
  
  return analysis;
}

function checkInstalledPackages() {
  log('📋 Vérification des packages installés...', 'blue');
  
  const criticalPackages = Object.keys(CRITICAL_DEPENDENCIES);
  const missingPackages = [];
  
  for (const pkg of criticalPackages) {
    const result = execCommand(`npm list ${pkg} --depth=0`);
    if (!result.success || result.output.includes('(empty)')) {
      missingPackages.push(pkg);
      log(`  ❌ ${pkg} - NON INSTALLÉ`, 'red');
    } else {
      log(`  ✅ ${pkg} - INSTALLÉ`, 'green');
    }
  }
  
  return missingPackages;
}

function createDependencyLock() {
  log('🔒 Création du fichier de verrouillage des dépendances...', 'blue');
  
  const lockContent = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: execCommand('npm --version').output?.trim() || 'unknown',
    criticalDependencies: CRITICAL_DEPENDENCIES,
    productionDependencies: PRODUCTION_DEPENDENCIES,
    checksums: {}
  };
  
  // Calculer les checksums des fichiers critiques
  const criticalFiles = ['package.json', 'tsconfig.json', 'tsup.config.js'];
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      lockContent.checksums[file] = require('crypto')
        .createHash('md5')
        .update(content)
        .digest('hex');
    }
  }
  
  fs.writeFileSync('dependency-lock.json', JSON.stringify(lockContent, null, 2));
  log('  ✅ dependency-lock.json créé', 'green');
}

function installMissingDependencies(missingPackages) {
  if (missingPackages.length === 0) {
    log('✅ Toutes les dépendances sont installées', 'green');
    return true;
  }
  
  log(`🔧 Installation de ${missingPackages.length} dépendances manquantes...`, 'blue');
  
  for (const pkg of missingPackages) {
    const expectedVersion = CRITICAL_DEPENDENCIES[pkg] || PRODUCTION_DEPENDENCIES[pkg];
    const isDev = CRITICAL_DEPENDENCIES.hasOwnProperty(pkg);
    
    const installCommand = `npm install ${pkg}@${expectedVersion} ${isDev ? '--save-dev' : '--save'}`;
    
    log(`  📦 Installation: ${pkg}@${expectedVersion}`, 'cyan');
    const result = execCommand(installCommand);
    
    if (result.success) {
      log(`  ✅ ${pkg} installé`, 'green');
    } else {
      log(`  ❌ Échec installation ${pkg}: ${result.error}`, 'red');
      return false;
    }
  }
  
  return true;
}

function fixDependencyConflicts() {
  log('🔧 Résolution des conflits de dépendances...', 'blue');
  
  const fixCommands = [
    'npm audit fix --force',
    'npm dedupe',
    'npm prune'
  ];
  
  for (const cmd of fixCommands) {
    log(`  🔧 ${cmd}`, 'cyan');
    const result = execCommand(cmd);
    if (result.success) {
      log(`  ✅ ${cmd} - Réussi`, 'green');
    } else {
      log(`  ⚠️ ${cmd} - Avertissement: ${result.error}`, 'yellow');
    }
  }
}

function verifyInstallation() {
  log('🔍 Vérification finale de l\'installation...', 'blue');
  
  const verificationCommands = [
    'npm list --depth=0',
    'npm audit --audit-level=moderate',
    'node -e "console.log(\'Node.js fonctionne\')"'
  ];
  
  let allPassed = true;
  
  for (const cmd of verificationCommands) {
    log(`  🔍 ${cmd}`, 'cyan');
    const result = execCommand(cmd);
    if (result.success) {
      log(`  ✅ ${cmd} - OK`, 'green');
    } else {
      log(`  ❌ ${cmd} - ÉCHEC`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

function generateDependencyReport() {
  log('📊 Génération du rapport de dépendances...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: execCommand('npm --version').output?.trim(),
    installedPackages: {},
    vulnerabilities: [],
    recommendations: []
  };
  
  // Analyser les packages installés
  const listResult = execCommand('npm list --depth=0 --json');
  if (listResult.success) {
    const listData = JSON.parse(listResult.output);
    report.installedPackages = listData.dependencies || {};
  }
  
  // Vérifier les vulnérabilités
  const auditResult = execCommand('npm audit --json');
  if (auditResult.success) {
    const auditData = JSON.parse(auditResult.output);
    report.vulnerabilities = auditData.vulnerabilities || {};
  }
  
  // Générer des recommandations
  if (Object.keys(report.vulnerabilities).length > 0) {
    report.recommendations.push('Exécuter: npm audit fix');
  }
  
  if (Object.keys(report.installedPackages).length < Object.keys(CRITICAL_DEPENDENCIES).length) {
    report.recommendations.push('Exécuter: npm install');
  }
  
  fs.writeFileSync('dependency-report.json', JSON.stringify(report, null, 2));
  log('  ✅ dependency-report.json généré', 'green');
}

// Fonction principale
async function runDependencyManager() {
  try {
    log('🚀 Démarrage du gestionnaire de dépendances...', 'bold');
    
    // 1. Vérifications préliminaires
    if (!checkNodeVersion()) {
      throw new Error('Version Node.js incompatible');
    }
    
    if (!checkNPMVersion()) {
      throw new Error('NPM non disponible');
    }
    
    // 2. Analyse des dépendances
    const analysis = analyzeCurrentDependencies();
    if (!analysis) {
      throw new Error('Impossible d\'analyser les dépendances');
    }
    
    // 3. Vérification des packages installés
    const missingPackages = checkInstalledPackages();
    
    // 4. Installation des dépendances manquantes
    if (!installMissingDependencies(missingPackages)) {
      throw new Error('Échec de l\'installation des dépendances');
    }
    
    // 5. Résolution des conflits
    fixDependencyConflicts();
    
    // 6. Vérification finale
    if (!verifyInstallation()) {
      log('⚠️ Vérification finale partiellement échouée', 'yellow');
    }
    
    // 7. Création des fichiers de verrouillage
    createDependencyLock();
    
    // 8. Génération du rapport
    generateDependencyReport();
    
    log('\n🎉 Gestion des dépendances terminée avec succès !', 'green');
    log('📁 Fichiers créés:', 'blue');
    log('  • dependency-lock.json', 'blue');
    log('  • dependency-report.json', 'blue');
    
  } catch (error) {
    log(`\n💥 ERREUR: ${error.message}`, 'red');
    log('\n🔄 Actions de récupération:', 'yellow');
    log('  1. rm -rf node_modules package-lock.json', 'yellow');
    log('  2. npm cache clean --force', 'yellow');
    log('  3. npm install', 'yellow');
    process.exit(1);
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  log('\n⚠️ Gestion des dépendances interrompue', 'yellow');
  process.exit(1);
});

// Exécution
runDependencyManager();