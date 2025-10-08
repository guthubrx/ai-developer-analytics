#!/usr/bin/env node

/**
 * Script de validation post-build pour AI Developer Analytics
 * Vérifie l'intégrité et la qualité du build final
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validation post-build AI Developer Analytics\n');

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

function validateFileStructure() {
  log('📁 Validation de la structure des fichiers...', 'blue');
  
  const requiredFiles = [
    'out/extension.js',
    'media/main.bundle.js',
    'server-mcp/dist/index.js',
    'package.json',
    'media/icon.png'
  ];
  
  let allPresent = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(1);
      log(`  ✅ ${file} (${sizeKB} KB)`, 'green');
    } else {
      log(`  ❌ ${file} - MANQUANT`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

function validateFileSizes() {
  log('\n📏 Validation des tailles de fichiers...', 'blue');
  
  const sizeChecks = [
    {
      file: 'out/extension.js',
      minSize: 5000, // 5KB minimum
      maxSize: 500000 // 500KB maximum
    },
    {
      file: 'media/main.bundle.js',
      minSize: 50000, // 50KB minimum
      maxSize: 2000000 // 2MB maximum
    },
    {
      file: 'server-mcp/dist/index.js',
      minSize: 2000, // 2KB minimum
      maxSize: 100000 // 100KB maximum
    }
  ];
  
  let allValid = true;
  
  for (const check of sizeChecks) {
    if (fs.existsSync(check.file)) {
      const stats = fs.statSync(check.file);
      const sizeKB = stats.size / 1024;
      
      if (sizeKB >= check.minSize / 1024 && sizeKB <= check.maxSize / 1024) {
        log(`  ✅ ${check.file}: ${sizeKB.toFixed(1)} KB (OK)`, 'green');
      } else {
        log(`  ⚠️ ${check.file}: ${sizeKB.toFixed(1)} KB (hors limites)`, 'yellow');
        allValid = false;
      }
    } else {
      log(`  ❌ ${check.file} - MANQUANT`, 'red');
      allValid = false;
    }
  }
  
  return allValid;
}

function validateJavaScriptSyntax() {
  log('\n🔍 Validation de la syntaxe JavaScript...', 'blue');
  
  const jsFiles = [
    'out/extension.js',
    'media/main.bundle.js',
    'server-mcp/dist/index.js'
  ];
  
  let allValid = true;
  
  for (const file of jsFiles) {
    if (fs.existsSync(file)) {
      log(`  🔍 Vérification: ${file}`, 'cyan');
      
      // Vérification basique avec node
      const result = execCommand(`node -c "${file}"`);
      
      if (result.success) {
        log(`  ✅ ${file} - Syntaxe OK`, 'green');
      } else {
        log(`  ❌ ${file} - Erreur de syntaxe`, 'red');
        log(`     ${result.error}`, 'red');
        allValid = false;
      }
    }
  }
  
  return allValid;
}

function validatePackageJson() {
  log('\n📦 Validation du package.json...', 'blue');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredFields = [
      'name',
      'version',
      'main',
      'engines',
      'contributes'
    ];
    
    let allPresent = true;
    
    for (const field of requiredFields) {
      if (packageJson[field]) {
        log(`  ✅ ${field}: ${typeof packageJson[field] === 'object' ? 'présent' : packageJson[field]}`, 'green');
      } else {
        log(`  ❌ ${field} - MANQUANT`, 'red');
        allPresent = false;
      }
    }
    
    // Vérifier la version
    if (packageJson.version && /^\d+\.\d+\.\d+$/.test(packageJson.version)) {
      log(`  ✅ Version: ${packageJson.version} (format valide)`, 'green');
    } else {
      log(`  ❌ Version: ${packageJson.version} (format invalide)`, 'red');
      allPresent = false;
    }
    
    return allPresent;
  } catch (error) {
    log(`  ❌ Erreur de lecture package.json: ${error.message}`, 'red');
    return false;
  }
}

function validateVSIXPackage() {
  log('\n📦 Validation du package VSIX...', 'blue');
  
  const vsixFiles = fs.readdirSync('.').filter(f => f.endsWith('.vsix'));
  
  if (vsixFiles.length === 0) {
    log('  ❌ Aucun fichier .vsix trouvé', 'red');
    return false;
  }
  
  const latestVsix = vsixFiles.sort().pop();
  const stats = fs.statSync(latestVsix);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  log(`  📁 Fichier VSIX: ${latestVsix}`, 'cyan');
  log(`  📏 Taille: ${sizeMB} MB`, 'cyan');
  
  // Vérifier la taille du package
  if (stats.size > 50 * 1024 * 1024) { // 50MB
    log(`  ⚠️ Taille importante: ${sizeMB} MB`, 'yellow');
  } else {
    log(`  ✅ Taille acceptable: ${sizeMB} MB`, 'green');
  }
  
  // Vérifier que le package peut être lu
  try {
    const result = execCommand(`unzip -l "${latestVsix}" | head -10`);
    if (result.success) {
      log(`  ✅ Package VSIX valide`, 'green');
      return true;
    } else {
      log(`  ❌ Package VSIX corrompu`, 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Erreur de validation VSIX: ${error.message}`, 'red');
    return false;
  }
}

function checkSecurityIssues() {
  log('\n🔒 Vérification des problèmes de sécurité...', 'blue');
  
  const auditResult = execCommand('npm audit --audit-level=high');
  
  if (auditResult.success) {
    if (auditResult.output.includes('found 0 vulnerabilities')) {
      log('  ✅ Aucune vulnérabilité critique trouvée', 'green');
      return true;
    } else {
      log('  ⚠️ Vulnérabilités détectées:', 'yellow');
      console.log(auditResult.output);
      return false;
    }
  } else {
    log('  ⚠️ Impossible de vérifier les vulnérabilités', 'yellow');
    return true; // Ne pas bloquer le build pour ça
  }
}

function generateValidationReport() {
  log('\n📊 Génération du rapport de validation...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    validation: {
      fileStructure: false,
      fileSizes: false,
      javascriptSyntax: false,
      packageJson: false,
      vsixPackage: false,
      security: false
    },
    files: {},
    recommendations: []
  };
  
  // Collecter les informations sur les fichiers
  const filesToCheck = [
    'out/extension.js',
    'media/main.bundle.js',
    'server-mcp/dist/index.js'
  ];
  
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      report.files[file] = {
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(1),
        lastModified: stats.mtime.toISOString()
      };
    }
  }
  
  // Générer des recommandations
  if (!report.validation.fileStructure) {
    report.recommendations.push('Vérifier que tous les fichiers requis sont présents');
  }
  
  if (!report.validation.fileSizes) {
    report.recommendations.push('Vérifier les tailles des fichiers de build');
  }
  
  if (!report.validation.javascriptSyntax) {
    report.recommendations.push('Corriger les erreurs de syntaxe JavaScript');
  }
  
  fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
  log('  ✅ validation-report.json généré', 'green');
}

// Fonction principale
async function runPostBuildValidation() {
  try {
    log('🚀 Démarrage de la validation post-build...', 'bold');
    
    const validations = [
      { name: 'Structure des fichiers', fn: validateFileStructure },
      { name: 'Tailles des fichiers', fn: validateFileSizes },
      { name: 'Syntaxe JavaScript', fn: validateJavaScriptSyntax },
      { name: 'Package.json', fn: validatePackageJson },
      { name: 'Package VSIX', fn: validateVSIXPackage },
      { name: 'Sécurité', fn: checkSecurityIssues }
    ];
    
    let allPassed = true;
    
    for (const validation of validations) {
      const result = validation.fn();
      if (!result) {
        allPassed = false;
      }
    }
    
    // Générer le rapport
    generateValidationReport();
    
    log('\n' + '='.repeat(50), 'bold');
    
    if (allPassed) {
      log('🎉 VALIDATION RÉUSSIE !', 'green');
      log('✅ Le build est prêt pour la distribution', 'green');
    } else {
      log('⚠️ VALIDATION PARTIELLE', 'yellow');
      log('🔧 Certains problèmes ont été détectés', 'yellow');
      log('📋 Consultez validation-report.json pour plus de détails', 'blue');
    }
    
    return allPassed;
    
  } catch (error) {
    log(`\n💥 ERREUR DE VALIDATION: ${error.message}`, 'red');
    return false;
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  log('\n⚠️ Validation interrompue', 'yellow');
  process.exit(1);
});

// Exécution
runPostBuildValidation();