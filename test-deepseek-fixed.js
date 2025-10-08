#!/usr/bin/env node

/**
 * Test DeepSeek API avec les corrections appliquées
 * Test DeepSeek API with applied fixes
 */

const https = require('https');

// Configuration
const API_KEY = process.env.DEEPSEEK_API_KEY || 'your-api-key-here';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const TIMEOUT = 60000; // 60 seconds

async function testDeepSeekFixed() {
    console.log('🧪 Test DeepSeek API avec les corrections appliquées');
    console.log('=' .repeat(60));

    if (!API_KEY || API_KEY === 'your-api-key-here') {
        console.error('❌ Veuillez définir DEEPSEEK_API_KEY dans les variables d\'environnement');
        process.exit(1);
    }

    const testPrompts = [
        'Bonjour, peux-tu me dire bonjour en français ?',
        'Qu\'est-ce que 2+2 ?',
        'Explique-moi brièvement ce qu\'est l\'intelligence artificielle.'
    ];

    for (let i = 0; i < testPrompts.length; i++) {
        const prompt = testPrompts[i];
        console.log(`\n📝 Test ${i + 1}/${testPrompts.length}: "${prompt}"`);
        console.log('-'.repeat(50));

        const startTime = Date.now();

        try {
            const response = await makeApiRequest(API_URL, {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                max_tokens: 100
            });

            const latency = Date.now() - startTime;
            const content = response.choices[0].message.content;
            const tokens = response.usage?.total_tokens || 0;
            const cost = (tokens / 1000) * 0.00014; // DeepSeek pricing

            console.log('✅ Réponse reçue !');
            console.log(`🔤 Contenu: ${content}`);
            console.log(`🧮 Tokens: ${tokens}`);
            console.log(`💰 Coût: $${cost.toFixed(6)}`);
            console.log(`⚡ Latence: ${latency}ms`);
            console.log(`🤖 Modèle: ${response.model}`);

        } catch (error) {
            const latency = Date.now() - startTime;
            console.error('❌ Erreur:', error.message);
            console.log(`⏱️  Temps écoulé: ${latency}ms`);
            
            if (error.message.includes('timeout')) {
                console.log('💡 Suggestion: Vérifiez votre connexion internet ou augmentez le timeout');
            } else if (error.message.includes('401')) {
                console.log('💡 Suggestion: Vérifiez votre clé API DeepSeek');
            } else if (error.message.includes('429')) {
                console.log('💡 Suggestion: Vous avez atteint la limite de taux, attendez un moment');
            }
        }

        // Pause entre les requêtes
        if (i < testPrompts.length - 1) {
            console.log('⏳ Pause de 2 secondes...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n🎉 Test terminé !');
}

function makeApiRequest(url, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: TIMEOUT
        };

        // Set up timeout
        const timeoutId = setTimeout(() => {
            req.destroy();
            reject(new Error(`Request timeout after ${TIMEOUT}ms - DeepSeek API did not respond`));
        }, TIMEOUT);

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                clearTimeout(timeoutId);
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse API response: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`API error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            clearTimeout(timeoutId);
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                reject(new Error(`Connection timeout or reset - DeepSeek API may be unavailable: ${error.message}`));
            } else {
                reject(new Error(`Network error: ${error.message}`));
            }
        });

        req.on('timeout', () => {
            req.destroy();
            clearTimeout(timeoutId);
            reject(new Error(`Request timeout after ${TIMEOUT}ms - DeepSeek API did not respond`));
        });

        req.write(postData);
        req.end();
    });
}

// Exécuter le test
testDeepSeekFixed().catch(console.error);