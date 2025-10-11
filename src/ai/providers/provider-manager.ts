/**
 * Provider Manager Module
 * Module de gestion des providers avec intégration VSCode
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { ProviderStorage, ProviderInfo } from './provider-storage';

/**
 * Provider Manager class
 * Classe de gestion des providers
 */
export class ProviderManager {
    private context: vscode.ExtensionContext;
    private storage: ProviderStorage;
    private statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.storage = new ProviderStorage(context);
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
    }

    /**
     * Initialize provider manager
     * Initialiser le gestionnaire de providers
     */
    async initialize(): Promise<void> {
        try {
            await this.storage.initialize();
            await this.updateStatusBar();
            this.registerCommands();
            this.registerConfigurationListener();
            console.log('✅ Provider Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Provider Manager:', error);
            throw error;
        }
    }

    /**
     * Register configuration change listener
     * Enregistrer l'écouteur de changement de configuration
     */
    private registerConfigurationListener(): void {
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('aiAnalytics')) {
                    console.log('🔍 [PROVIDER-MANAGER] Configuration changed, updating providers...');
                    // Forcer la mise à jour des providers au prochain accès
                    this.updateStatusBar().catch(error => {
                        console.warn('⚠️ [PROVIDER-MANAGER] Failed to update status bar:', error);
                    });
                }
            })
        );
    }

    /**
     * Register VSCode commands
     * Enregistrer les commandes VSCode
     */
    private registerCommands(): void {
        // Command to show provider status
        const showStatusCommand = vscode.commands.registerCommand(
            'ai-developer-analytics.providers.showStatus',
            () => this.showProviderStatus()
        );

        // Command to export provider configuration
        const exportCommand = vscode.commands.registerCommand(
            'ai-developer-analytics.providers.export',
            () => this.exportProviderConfig()
        );

        // Command to reset providers
        const resetCommand = vscode.commands.registerCommand(
            'ai-developer-analytics.providers.reset',
            () => this.resetProviders()
        );

        this.context.subscriptions.push(
            showStatusCommand,
            exportCommand,
            resetCommand
        );
    }

    /**
     * Update status bar with provider info
     * Mettre à jour la barre d'état avec les infos des providers
     */
    private async updateStatusBar(): Promise<void> {
        try {
            const stats = await this.storage.getStatistics();
            const enabledCount = stats.enabledProviders;
            const configuredCount = stats.configuredProviders;

            this.statusBarItem.text = `🤖 ${enabledCount}/${configuredCount} Providers`;
            this.statusBarItem.tooltip = `AI Providers: ${enabledCount} enabled, ${configuredCount} configured`;
            this.statusBarItem.show();
        } catch (error) {
            console.warn('⚠️ Failed to update status bar:', error);
            this.statusBarItem.text = '🤖 Providers';
            this.statusBarItem.tooltip = 'AI Providers Manager';
            this.statusBarItem.show();
        }
    }

    /**
     * Get all providers with automatic API key detection
     * Obtenir tous les providers avec détection automatique des clés API
     */
    async getAllProviders(): Promise<ProviderInfo[]> {
        const providers = await this.storage.loadProviders();

        // Détecter automatiquement les clés API configurées
        const updatedProviders = await this.detectApiKeys(providers);

        return updatedProviders;
    }

    /**
     * Detect API keys from VSCode settings
     * Détecter les clés API depuis les settings VSCode
     */
    private async detectApiKeys(providers: ProviderInfo[]): Promise<ProviderInfo[]> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');

        // Map des clés API par provider
        const apiKeyMap: Record<string, string> = {
            'openai': config.get('openaiApiKey') || '',
            'anthropic': config.get('anthropicApiKey') || '',
            'deepseek': config.get('deepseekApiKey') || '',
            'moonshot': config.get('moonshotApiKey') || ''
        };

        // Mettre à jour les providers avec les clés API détectées
        const updatedProviders = providers.map(provider => {
            const apiKey = apiKeyMap[provider.id];
            const hasApiKey = !!apiKey && apiKey.trim().length > 0;

            // Si le statut de la clé API a changé, mettre à jour le provider
            if (provider.apiKeyConfigured !== hasApiKey) {
                console.log(`🔍 [PROVIDER-MANAGER] API key status changed for ${provider.name}: ${hasApiKey ? 'Configured' : 'Not configured'}`);

                // Mettre à jour le provider dans le stockage
                this.storage.updateProvider(provider.id, {
                    apiKeyConfigured: hasApiKey
                }).catch(error => {
                    console.warn(`⚠️ [PROVIDER-MANAGER] Failed to update provider ${provider.id}:`, error);
                });

                return {
                    ...provider,
                    apiKeyConfigured: hasApiKey
                };
            }

            return provider;
        });

        return updatedProviders;
    }

    /**
     * Get available provider IDs for dropdown
     * Obtenir les IDs des providers disponibles pour le menu déroulant
     */
    async getAvailableProviderIds(): Promise<string[]> {
        const providers = await this.storage.loadProviders();
        return providers
            .filter(p => p.enabled)
            .map(p => p.id);
    }

    /**
     * Get provider details for dropdown
     * Obtenir les détails des providers pour le menu déroulant
     */
    async getProviderDetails(): Promise<Array<{ id: string; name: string; description?: string | undefined }>> {
        const providers = await this.storage.loadProviders();
        return providers
            .filter(p => p.enabled)
            .map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || undefined
            }));
    }

    /**
     * Update provider API key status
     * Mettre à jour le statut de la clé API d'un provider
     */
    async updateProviderApiKeyStatus(providerId: string, hasApiKey: boolean): Promise<boolean> {
        const success = await this.storage.updateProvider(providerId, {
            apiKeyConfigured: hasApiKey
        });

        if (success) {
            await this.updateStatusBar();
        }

        return success;
    }

    /**
     * Enable/disable provider
     * Activer/désactiver un provider
     */
    async setProviderEnabled(providerId: string, enabled: boolean): Promise<boolean> {
        const success = await this.storage.updateProvider(providerId, {
            enabled: enabled
        });

        if (success) {
            await this.updateStatusBar();
            vscode.window.showInformationMessage(
                `${enabled ? '✅' : '❌'} Provider ${providerId} ${enabled ? 'enabled' : 'disabled'}`
            );
        }

        return success;
    }

    /**
     * Show provider status in a quick pick
     * Afficher le statut des providers dans un menu rapide
     */
    async showProviderStatus(): Promise<void> {
        try {
            const providers = await this.storage.loadProviders();
            const stats = await this.storage.getStatistics();

            const items: vscode.QuickPickItem[] = [
                {
                    label: '📊 Provider Statistics',
                    description: `Total: ${stats.totalProviders}, Enabled: ${stats.enabledProviders}, Configured: ${stats.configuredProviders}`,
                    alwaysShow: true
                },
                {
                    label: '---',
                    kind: vscode.QuickPickItemKind.Separator
                }
            ];

            providers.forEach(provider => {
                const statusIcon = provider.enabled ?
                    (provider.apiKeyConfigured ? '✅' : '⚠️') : '❌';

                items.push({
                    label: `${statusIcon} ${provider.name}`,
                    description: provider.description || `ID: ${provider.id}`,
                    detail: provider.enabled ?
                        (provider.apiKeyConfigured ? 'Ready to use' : 'API key not configured') :
                        'Disabled'
                });
            });

            items.push(
                {
                    label: '---',
                    kind: vscode.QuickPickItemKind.Separator
                },
                {
                    label: '📤 Export Configuration',
                    description: 'Export provider configuration to JSON',
                    alwaysShow: true
                },
                {
                    label: '🔄 Reset to Defaults',
                    description: 'Reset all providers to default configuration',
                    alwaysShow: true
                }
            );

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Provider Status and Management',
                title: 'AI Provider Manager'
            });

            if (selected) {
                if (selected.label === '📤 Export Configuration') {
                    await this.exportProviderConfig();
                } else if (selected.label === '🔄 Reset to Defaults') {
                    await this.resetProviders();
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show provider status: ${error}`);
        }
    }

    /**
     * Export provider configuration
     * Exporter la configuration des providers
     */
    async exportProviderConfig(): Promise<void> {
        try {
            const config = await this.storage.exportConfig();
            const content = JSON.stringify(config, null, 2);

            const uri = await vscode.window.showSaveDialog({
                filters: {
                    'JSON': ['json']
                },
                defaultUri: vscode.Uri.file('ai-providers-config.json')
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
                vscode.window.showInformationMessage(`✅ Provider configuration exported to ${uri.fsPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export provider configuration: ${error}`);
        }
    }

    /**
     * Reset providers to defaults
     * Réinitialiser les providers aux valeurs par défaut
     */
    async resetProviders(): Promise<void> {
        const response = await vscode.window.showWarningMessage(
            'Are you sure you want to reset all providers to defaults?',
            { modal: true },
            'Reset'
        );

        if (response === 'Reset') {
            try {
                await this.storage.resetToDefaults();
                await this.updateStatusBar();
                vscode.window.showInformationMessage('✅ Providers reset to defaults');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reset providers: ${error}`);
            }
        }
    }

    /**
     * Get storage location
     * Obtenir l'emplacement du stockage
     */
    getStorageLocation(): string {
        return this.storage.getStorageFilePath();
    }

    /**
     * Dispose resources
     * Libérer les ressources
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}