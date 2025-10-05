/**
 * DeepSeek Integration Tests (requires real API key)
 * Tests d'intégration DeepSeek (nécessite une vraie clé API)
 *
 * @license AGPL-3.0-only
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { DeepSeekClient } from '../ai/clients/deepseek-client';

// This test suite should only run when REAL_API_KEY environment variable is set
// Cette suite de tests ne doit s'exécuter que lorsque la variable d'environnement REAL_API_KEY est définie
const shouldRunIntegrationTests = process.env.REAL_DEEPSEEK_API_KEY !== undefined;

(shouldRunIntegrationTests ? suite : suite.skip)('DeepSeek Integration Test Suite', () => {
    let deepseekClient: DeepSeekClient;
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        const realApiKey = process.env.REAL_DEEPSEEK_API_KEY!;

        mockContext = {
            secrets: {
                get: async (key: string) => {
                    if (key === 'deepseek-api-key') {
                        return realApiKey;
                    }
                    return undefined;
                },
                store: async () => {},
                delete: async () => {}
            } as any
        } as vscode.ExtensionContext;

        deepseekClient = new DeepSeekClient(mockContext);
    });

    test('should connect to real DeepSeek API', async () => {
        await deepseekClient.initialize();

        const isAvailable = await deepseekClient.isAvailable();
        assert.strictEqual(isAvailable, true, 'Should be available with real API key');

        const response = await deepseekClient.execute('Say "Hello World" in French');

        // Verify real API response
        // Vérifier la réponse de l'API réelle
        assert.ok(response.content.includes('Bonjour') || response.content.includes('Hello'),
                 'Should contain greeting in response');
        assert.strictEqual(response.provider, 'deepseek', 'Provider should be deepseek');
        assert.ok(response.tokens > 0, 'Should have positive token count');
        assert.ok(response.latency > 0, 'Should have positive latency');
        assert.ok(response.cost >= 0, 'Should have non-negative cost');
    });

    test('should handle different prompt types', async () => {
        await deepseekClient.initialize();

        const testPrompts = [
            'Explain quantum computing in simple terms',
            'Write a Python function to calculate fibonacci sequence',
            'What is the capital of France?'
        ];

        for (const prompt of testPrompts) {
            const response = await deepseekClient.execute(prompt);

            assert.ok(response.content.length > 0, `Should get response for: ${prompt}`);
            assert.strictEqual(response.provider, 'deepseek', 'Provider should be deepseek');
            assert.ok(response.tokens > 0, 'Should have token count');
        }
    });

    test('should calculate reasonable costs', async () => {
        await deepseekClient.initialize();

        const shortPrompt = 'Hi';
        const longPrompt = 'Explain the theory of relativity in detail with examples and mathematical formulas.';

        const shortResponse = await deepseekClient.execute(shortPrompt);
        const longResponse = await deepseekClient.execute(longPrompt);

        // Long prompt should cost more than short prompt
        // Le prompt long devrait coûter plus que le prompt court
        assert.ok(longResponse.cost > shortResponse.cost,
                 'Longer prompt should have higher cost');

        // Costs should be very low (DeepSeek is cost-effective)
        // Les coûts devraient être très bas (DeepSeek est rentable)
        assert.ok(shortResponse.cost < 0.01, 'Short prompt should be very cheap');
        assert.ok(longResponse.cost < 0.10, 'Long prompt should still be affordable');
    });
});