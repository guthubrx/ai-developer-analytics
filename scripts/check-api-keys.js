#!/usr/bin/env node

/**
 * Script pour vérifier la configuration des clés API
 */

function checkApiKeys() {
    console.log('🔍 Vérification des clés API configurées...\n');

    // Simuler la récupération des configurations
    const config = {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'Non configurée',
        openaiApiKey: process.env.OPENAI_API_KEY || 'Non configurée',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'Non configurée',
        moonshotApiKey: process.env.MOONSHOT_API_KEY || 'Non configurée'
    };

    console.log('📋 État des clés API :');
    console.log(`   DeepSeek: ${config.deepseekApiKey}`);
    console.log(`   OpenAI: ${config.openaiApiKey}`);
    console.log(`   Anthropic: ${config.anthropicApiKey}`);
    console.log(`   Moonshot: ${config.moonshotApiKey}`);

    console.log('\n💡 Pour configurer les clés API dans VSCode :');
    console.log('   1. Ouvrez les paramètres (Cmd+,)');
    console.log('   2. Recherchez "AI Analytics"');
    console.log('   3. Configurez les clés dans la section API Keys');
    console.log('\n🔧 Test recommandé :');
    console.log('   - Utilisez DeepSeek (gratuit) pour commencer');
    console.log('   - Obtenez une clé sur: https://platform.deepseek.com/api_keys');
}

checkApiKeys();