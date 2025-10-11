/**
 * Test script for Provider Storage System
 * Script de test pour le système de stockage des providers
 *
 * Usage: node test-providers-storage.js
 */

const fs = require('fs');
const path = require('path');

// Simulate VSCode extension context
class MockExtensionContext {
    constructor() {
        this.globalStorageUri = {
            fsPath: path.join(__dirname, '.vscode-test', 'globalStorage')
        };
    }
}

async function testProviderStorage() {
    console.log('🧪 Testing Provider Storage System...\n');

    try {
        // Import the provider storage module
        const { ProviderStorage } = require('./dist/ai/providers/provider-storage.js');

        // Create mock context
        const context = new MockExtensionContext();
        const storage = new ProviderStorage(context);

        console.log('📦 Initializing storage...');
        await storage.initialize();

        console.log('📥 Loading providers...');
        const providers = await storage.loadProviders();

        console.log(`✅ Loaded ${providers.length} providers:`);
        providers.forEach(provider => {
            const status = provider.enabled ?
                (provider.apiKeyConfigured ? '✅ Ready' : '⚠️ No API Key') :
                '❌ Disabled';
            console.log(`   - ${provider.name} (${provider.id}): ${status}`);
        });

        console.log('\n📊 Getting statistics...');
        const stats = await storage.getStatistics();
        console.log(`   Total: ${stats.totalProviders}`);
        console.log(`   Enabled: ${stats.enabledProviders}`);
        console.log(`   Configured: ${stats.configuredProviders}`);
        console.log(`   Storage: ${stats.storageLocation}`);

        console.log('\n🔧 Testing provider update...');
        const success = await storage.updateProvider('openai', {
            apiKeyConfigured: true
        });
        console.log(`   Update result: ${success ? '✅ Success' : '❌ Failed'}`);

        console.log('\n📤 Exporting configuration...');
        const config = await storage.exportConfig();
        console.log(`   Version: ${config.version}`);
        console.log(`   Last Updated: ${config.lastUpdated}`);

        console.log('\n🎉 Provider Storage System test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testProviderStorage();
}

module.exports = { testProviderStorage };