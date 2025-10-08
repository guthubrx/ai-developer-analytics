#!/usr/bin/env node

/**
 * Test de l'extension DeepSeek avec les corrections
 * Extension DeepSeek test with fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration DeepSeek dans l\'extension');
console.log('=' .repeat(60));

// Vérifier les fichiers modifiés
const filesToCheck = [
    'src/ai/clients/deepseek-client.ts',
    'package.json'
];

let allGood = true;

filesToCheck.forEach(file => {
    console.log(`\n📁 Vérification de ${file}:`);
    
    if (!fs.existsSync(file)) {
        console.log('❌ Fichier non trouvé');
        allGood = false;
        return;
    }

    const content = fs.readFileSync(file, 'utf8');
    
    if (file === 'src/ai/clients/deepseek-client.ts') {
        // Vérifier les corrections
        const checks = [
            { pattern: /https:\/\/api\.deepseek\.com\/v1\/chat\/completions/, name: 'URL API corrigée' },
            { pattern: /timeout: this\.timeout/, name: 'Configuration timeout' },
            { pattern: /Request timeout after.*ms.*DeepSeek API did not respond/, name: 'Message d\'erreur timeout' },
            { pattern: /clearTimeout\(timeoutId\)/, name: 'Nettoyage timeout' },
            { pattern: /ECONNRESET.*ETIMEDOUT/, name: 'Gestion erreurs réseau' }
        ];

        checks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`  ✅ ${check.name}`);
            } else {
                console.log(`  ❌ ${check.name} - MANQUANT`);
                allGood = false;
            }
        });
    } else if (file === 'package.json') {
        // Vérifier la configuration
        if (content.includes('aiAnalytics.apiTimeout')) {
            console.log('  ✅ Configuration apiTimeout ajoutée');
        } else {
            console.log('  ❌ Configuration apiTimeout - MANQUANTE');
            allGood = false;
        }
    }
});

console.log('\n' + '='.repeat(60));

if (allGood) {
    console.log('🎉 Toutes les corrections sont en place !');
    console.log('\n📋 Résumé des corrections appliquées:');
    console.log('  • URL API corrigée: /v1/chat/completions');
    console.log('  • Timeout configurable ajouté (60s par défaut)');
    console.log('  • Gestion d\'erreurs améliorée');
    console.log('  • Messages d\'erreur plus informatifs');
    console.log('  • Nettoyage des timeouts');
    
    console.log('\n🚀 Prochaines étapes:');
    console.log('  1. Redémarrer l\'extension VS Code');
    console.log('  2. Configurer votre clé API DeepSeek');
    console.log('  3. Tester avec un prompt simple');
    console.log('  4. Ajuster le timeout si nécessaire');
} else {
    console.log('❌ Certaines corrections sont manquantes');
    console.log('Veuillez vérifier les fichiers et réappliquer les corrections.');
}

console.log('\n💡 Pour tester manuellement:');
console.log('  export DEEPSEEK_API_KEY="votre-clé-api"');
console.log('  node test-deepseek-fixed.js');