#!/usr/bin/env node

/**
 * Script de vérification pré-build pour AI Developer Analytics
 * Vérifie que toutes les dépendances critiques sont présentes avant le build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Vérification pré-build en cours...\n');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCriticalDependencies() {
  log('📦 Vérification des dépendances critiques...', 'blue');
  
  const criticalDeps = [
    '@types/vscode',
    'typescript',
    'tsup',
    'vsce'
  ];
  
  let allDepsPresent = true;
  
  for (const dep of criticalDeps) {
    try {
      execSync(`npm list ${dep}`, { stdio: 'pipe' });
      log(`  ✅ ${dep}`, 'green');
    } catch (error) {
      log(`  ❌ ${dep} - MANQUANT`, 'red');
      allDepsPresent = false;
    }
  }
  
  return allDepsPresent;
}

function checkNodeVersion() {
  log('\n🟢 Vérification de la version Node.js...', 'blue');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    log(`  ✅ Node.js ${nodeVersion} (compatible)`, 'green');
    return true;
  } else {
    log(`  ❌ Node.js ${nodeVersion} (version trop ancienne, minimum 18 requis)`, 'red');
    return false;
  }
}

function checkFileStructure() {
  log('\n📁 Vérification de la structure des fichiers...', 'blue');
  
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'src/extension.ts',
    'media/main.js',
    'server-mcp/package.json'
  ];
  
  let allFilesPresent = true;
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - MANQUANT`, 'red');
      allFilesPresent = false;
    }
  }
  
  return allFilesPresent;
}

function checkTypeScriptConfig() {
  log('\n⚙️ Vérification de la configuration TypeScript...', 'blue');
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    // Vérifier les options critiques
    const criticalOptions = {
      'target': tsconfig.compilerOptions?.target,
      'module': tsconfig.compilerOptions?.module,
      'outDir': tsconfig.compilerOptions?.outDir,
      'rootDir': tsconfig.compilerOptions?.rootDir
    };
    
    let configValid = true;
    for (const [key, value] of Object.entries(criticalOptions)) {
      if (value) {
        log(`  ✅ ${key}: ${value}`, 'green');
      } else {
        log(`  ❌ ${key}: MANQUANT`, 'red');
        configValid = false;
      }
    }
    
    return configValid;
  } catch (error) {
    log(`  ❌ Erreur de lecture tsconfig.json: ${error.message}`, 'red');
    return false;
  }
}

function checkBuildArtifacts() {
  log('\n🔨 Vérification des artefacts de build existants...', 'blue');
  
  const artifacts = [
    'out/extension.js',
    'media/main.bundle.js',
    'server-mcp/dist/index.js'
  ];
  
  let hasArtifacts = false;
  
  for (const artifact of artifacts) {
    if (fs.existsSync(artifact)) {
      const stats = fs.statSync(artifact);
      const age = Date.now() - stats.mtime.getTime();
      const ageHours = Math.floor(age / (1000 * 60 * 60));
      
      if (ageHours < 24) {
        log(`  ✅ ${artifact} (${ageHours}h)`, 'green');
        hasArtifacts = true;
      } else {
        log(`  ⚠️ ${artifact} (${ageHours}h - ancien)`, 'yellow');
      }
    } else {
      log(`  ❌ ${artifact} - MANQUANT`, 'red');
    }
  }
  
  return hasArtifacts;
}

// Exécution des vérifications
async function runPreBuildCheck() {
  const checks = [
    { name: 'Dépendances critiques', fn: checkCriticalDependencies },
    { name: 'Version Node.js', fn: checkNodeVersion },
    { name: 'Structure des fichiers', fn: checkFileStructure },
    { name: 'Configuration TypeScript', fn: checkTypeScriptConfig },
    { name: 'Artefacts de build', fn: checkBuildArtifacts }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = check.fn();
    if (!result) {
      allPassed = false;
    }
  }
  
  log('\n' + '='.repeat(50), 'bold');
  
  if (allPassed) {
    log('🎉 Toutes les vérifications sont passées ! Build autorisé.', 'green');
    process.exit(0);
  } else {
    log('❌ Certaines vérifications ont échoué. Build bloqué.', 'red');
    log('\n💡 Actions recommandées :', 'yellow');
    log('  1. Exécuter: npm install', 'yellow');
    log('  2. Vérifier: npm list @types/vscode', 'yellow');
    log('  3. Nettoyer: rm -rf node_modules package-lock.json && npm install', 'yellow');
    process.exit(1);
  }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  log(`\n💥 Erreur critique: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`\n💥 Promesse rejetée: ${reason}`, 'red');
  process.exit(1);
});

// Exécution
runPreBuildCheck();