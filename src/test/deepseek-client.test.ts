/**
 * DeepSeek Client Tests
 * Tests du client DeepSeek
 *
 * @license AGPL-3.0-only
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { DeepSeekClient } from '../ai/clients/deepseek-client';

suite('DeepSeek Client Test Suite', () => {
    let deepseekClient: DeepSeekClient;
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        // Create mock extension context
        // Créer un contexte d'extension mock
        mockContext = {
            secrets: {
                get: async (key: string) => {
                    if (key === 'deepseek-api-key') {
                        return 'test-api-key';
                    }
                    return undefined;
                },
                store: async () => {},
                delete: async () => {}
            } as any
        } as vscode.ExtensionContext;

        deepseekClient = new DeepSeekClient(mockContext);
    });

    test('should initialize with API key', async () => {
        await deepseekClient.initialize();
        const isAvailable = await deepseekClient.isAvailable();
        assert.strictEqual(isAvailable, true, 'DeepSeek client should be available with API key');
    });

    test('should return correct provider name', () => {
        const provider = deepseekClient.getProvider();
        assert.strictEqual(provider, 'deepseek', 'Provider should be deepseek');
    });

    test('should calculate tokens correctly', async () => {
        const testPrompt = 'Hello, world!';
        // Simple token calculation: 1 token ≈ 4 characters
        // Calcul simple de tokens : 1 token ≈ 4 caractères
        const expectedTokens = Math.ceil(testPrompt.length / 4);

        // Note: This tests the base class method
        // Note : Ceci teste la méthode de la classe de base
        const response = await deepseekClient.execute(testPrompt);
        assert.ok(response.tokens >= expectedTokens, 'Should calculate reasonable token count');
    });

    test('should handle API errors gracefully', async () => {
        // Test with invalid API key scenario
        // Tester avec un scénario de clé API invalide
        const mockErrorContext = {
            secrets: {
                get: async () => undefined, // No API key
                store: async () => {},
                delete: async () => {}
            } as any
        } as vscode.ExtensionContext;

        const clientWithoutKey = new DeepSeekClient(mockErrorContext);
        await clientWithoutKey.initialize();

        try {
            await clientWithoutKey.execute('test prompt');
            assert.fail('Should have thrown an error for missing API key');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw Error instance');
            assert.match(error.message, /API key not configured/, 'Error should mention API key');
        }
    });

    test('should return response with expected structure', async () => {
        await deepseekClient.initialize();

        const response = await deepseekClient.execute('What is 2+2?');

        // Verify response structure
        // Vérifier la structure de la réponse
        assert.ok(response.content, 'Response should have content');
        assert.strictEqual(response.provider, 'deepseek', 'Provider should be deepseek');
        assert.ok(response.tokens > 0, 'Should have token count');
        assert.ok(response.cost >= 0, 'Should have cost calculation');
        assert.ok(response.latency >= 0, 'Should have latency measurement');
        assert.strictEqual(response.cacheHit, false, 'Should not be cached in test');
        assert.ok(response.model, 'Should specify model');
    });
});