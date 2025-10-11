/**
 * Provider Diagnostic Script
 * Script de diagnostic pour visualiser les providers stockés
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { ProviderManager } from './provider-manager';

/**
 * Diagnostic command to show provider storage information
 * Commande de diagnostic pour afficher les informations de stockage des providers
 */
export function registerProviderDiagnosticCommand(context: vscode.ExtensionContext): void {
    const diagnosticCommand = vscode.commands.registerCommand(
        'ai-developer-analytics.providers.diagnostic',
        async () => {
            try {
                const providerManager = new ProviderManager(context);
                await providerManager.initialize();

                const providers = await providerManager.getAllProviders();
                const storageLocation = providerManager.getStorageLocation();

                // Create diagnostic output
                let output = `# AI Provider Diagnostic Report\n`;
                output += `Generated: ${new Date().toISOString()}\n\n`;

                output += `## Storage Information\n`;
                output += `- **Storage Location**: ${storageLocation}\n`;
                output += `- **Total Providers**: ${providers.length}\n`;
                output += `- **Enabled Providers**: ${providers.filter(p => p.enabled).length}\n`;
                output += `- **Configured Providers**: ${providers.filter(p => p.apiKeyConfigured).length}\n\n`;

                output += `## Provider Details\n`;
                providers.forEach(provider => {
                    const statusIcon = provider.enabled ?
                        (provider.apiKeyConfigured ? '✅' : '⚠️') : '❌';

                    output += `### ${statusIcon} ${provider.name} (${provider.id})\n`;
                    output += `- **Status**: ${provider.enabled ? 'Enabled' : 'Disabled'}${provider.apiKeyConfigured ? ', API Key Configured' : ', API Key Missing'}\n`;
                    output += `- **Description**: ${provider.description || 'No description'}\n`;
                    output += `- **Last Checked**: ${provider.lastChecked || 'Never'}\n`;

                    if (provider.metadata) {
                        output += `- **Metadata**:\n`;
                        if (provider.metadata.supportsStreaming !== undefined) {
                            output += `  - Streaming: ${provider.metadata.supportsStreaming ? 'Yes' : 'No'}\n`;
                        }
                        if (provider.metadata.supportsToolCalls !== undefined) {
                            output += `  - Tool Calls: ${provider.metadata.supportsToolCalls ? 'Yes' : 'No'}\n`;
                        }
                        if (provider.metadata.maxContextTokens) {
                            output += `  - Max Context: ${provider.metadata.maxContextTokens.toLocaleString()} tokens\n`;
                        }
                        if (provider.metadata.costPerMillionTokens !== undefined) {
                            output += `  - Cost: $${provider.metadata.costPerMillionTokens}/M tokens\n`;
                        }
                    }
                    output += `\n`;
                });

                // Show in output panel
                const outputChannel = vscode.window.createOutputChannel('AI Provider Diagnostic');
                outputChannel.show();
                outputChannel.append(output);

                // Also show quick summary
                vscode.window.showInformationMessage(
                    `Provider diagnostic complete. Check output panel for details.`,
                    'Open Output Panel'
                ).then(selection => {
                    if (selection === 'Open Output Panel') {
                        outputChannel.show();
                    }
                });

                // Clean up
                providerManager.dispose();

            } catch (error) {
                vscode.window.showErrorMessage(`Provider diagnostic failed: ${error}`);
            }
        }
    );

    context.subscriptions.push(diagnosticCommand);
}

/**
 * Command to export provider configuration as JSON
 * Commande pour exporter la configuration des providers en JSON
 */
export function registerProviderExportCommand(context: vscode.ExtensionContext): void {
    const exportCommand = vscode.commands.registerCommand(
        'ai-developer-analytics.providers.exportJson',
        async () => {
            try {
                const providerManager = new ProviderManager(context);
                await providerManager.initialize();

                const providers = await providerManager.getAllProviders();
                const config = {
                    version: '1.0.0',
                    exportDate: new Date().toISOString(),
                    providers: providers
                };

                const content = JSON.stringify(config, null, 2);

                // Create and show a new document
                const doc = await vscode.workspace.openTextDocument({
                    content: content,
                    language: 'json'
                });

                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('Provider configuration exported to JSON document');

                providerManager.dispose();

            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export provider configuration: ${error}`);
            }
        }
    );

    context.subscriptions.push(exportCommand);
}

/**
 * Command to validate provider storage
 * Commande pour valider le stockage des providers
 */
export function registerProviderValidationCommand(context: vscode.ExtensionContext): void {
    const validationCommand = vscode.commands.registerCommand(
        'ai-developer-analytics.providers.validate',
        async () => {
            try {
                const providerManager = new ProviderManager(context);
                await providerManager.initialize();

                const providers = await providerManager.getAllProviders();
                const issues: string[] = [];

                // Check for issues
                if (providers.length === 0) {
                    issues.push('❌ No providers found in storage');
                }

                const enabledProviders = providers.filter(p => p.enabled);
                if (enabledProviders.length === 0) {
                    issues.push('⚠️ No providers are enabled');
                }

                const configuredProviders = enabledProviders.filter(p => p.apiKeyConfigured);
                if (configuredProviders.length === 0) {
                    issues.push('⚠️ No enabled providers have API keys configured');
                }

                // Check for duplicate IDs
                const providerIds = providers.map(p => p.id);
                const duplicateIds = providerIds.filter((id, index) => providerIds.indexOf(id) !== index);
                if (duplicateIds.length > 0) {
                    issues.push(`❌ Duplicate provider IDs found: ${duplicateIds.join(', ')}`);
                }

                // Show results
                if (issues.length === 0) {
                    vscode.window.showInformationMessage(
                        '✅ Provider storage validation passed - no issues found'
                    );
                } else {
                    const message = `Provider storage validation found ${issues.length} issue(s):\n${issues.join('\n')}`;
                    vscode.window.showWarningMessage(message, 'Show Details').then(selection => {
                        if (selection === 'Show Details') {
                            const outputChannel = vscode.window.createOutputChannel('Provider Validation');
                            outputChannel.show();
                            outputChannel.appendLine('Provider Storage Validation Results:');
                            issues.forEach(issue => outputChannel.appendLine(issue));
                        }
                    });
                }

                providerManager.dispose();

            } catch (error) {
                vscode.window.showErrorMessage(`Provider validation failed: ${error}`);
            }
        }
    );

    context.subscriptions.push(validationCommand);
}