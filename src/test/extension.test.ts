/**
 * Extension tests
 * Tests de l'extension
 *
 * @license AGPL-3.0-only
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate } from '../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('ai-developer-analytics'));
    });

    test('should activate', async () => {
        const context = {
            subscriptions: [],
            extensionUri: vscode.Uri.parse('file:///test'),
            extensionPath: '/test',
            globalStorageUri: vscode.Uri.parse('file:///test/storage'),
            globalStoragePath: '/test/storage',
            logUri: vscode.Uri.parse('file:///test/logs'),
            logPath: '/test/logs',
            extensionMode: vscode.ExtensionMode.Test,
            environmentVariableCollection: {} as any,
            storageUri: vscode.Uri.parse('file:///test/storage'),
            storagePath: '/test/storage',
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {}
            } as any,
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            } as any,
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve()
            } as any,
            extension: {
                id: 'test',
                extensionUri: vscode.Uri.parse('file:///test'),
                extensionPath: '/test',
                isActive: true,
                packageJSON: {},
                exports: undefined,
                activate: () => Promise.resolve({})
            } as any
        };

        await activate(context as any);
        assert.ok(true);
    });
});