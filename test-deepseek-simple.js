/**
 * Test DeepSeek simple sans compilation
 * Test DeepSeek simple sans compilation
 */

const axios = require('axios');

async function testDeepSeekSimple() {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error('❌ Clé API manquante !');
        console.log('💡 Utilisation:');
        console.log('   export DEEPSEEK_API_KEY="votre-clé-api"');
        console.log('   node test-deepseek-simple.js');
        return;
    }

    console.log('🚀 Test DeepSeek API (sans compilation)');
    console.log('========================================\n');

    const prompts = [
        'Bonjour ! Peux-tu te présenter en français ?',
        'Explique TypeScript en une phrase',
        'Donne un exemple de fonction JavaScript'
    ];

    for (let i = 0; i < prompts.length; i++) {
        console.log(`📋 Test ${i + 1}/${prompts.length}`);
        console.log('─'.repeat(40));
        console.log(`📝 Prompt: ${prompts[i]}`);

        const startTime = Date.now();

        try {
            const response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompts[i] }],
                    stream: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    timeout: 30000
                }
            );

            const latency = Date.now() - startTime;
            const content = response.data.choices[0].message.content;
            const tokens = response.data.usage.total_tokens;
            const cost = (tokens / 1000) * 0.00014; // DeepSeek pricing

            console.log('✅ Réponse reçue !');
            console.log(`🔤 Contenu: ${content}`);
            console.log(`🧮 Tokens: ${tokens}`);
            console.log(`💰 Coût: $${cost.toFixed(6)}`);
            console.log(`⚡ Latence: ${latency}ms`);
            console.log(`🤖 Modèle: ${response.data.model}`);

        } catch (error) {
            console.error('❌ Erreur:', error.response?.data || error.message);
        }

        // Pause entre les requêtes
        if (i < prompts.length - 1) {
            console.log('⏳ Pause de 2 secondes...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n🎉 Test terminé avec succès !');
}

// Installation simple d'axios si nécessaire
async function ensureAxios() {
    try {
        require('axios');
    } catch (error) {
        console.log('📦 Installation d\'axios...');
        const { execSync } = require('child_process');
        execSync('npm install axios', { stdio: 'inherit' });
    }
}

// Exécution
ensureAxios().then(() => {
    testDeepSeekSimple().catch(console.error);
});