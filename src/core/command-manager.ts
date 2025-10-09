/**
 * Command Manager - Centralized command registration and handling
 * Gestionnaire de Commandes - Enregistrement et gestion centralisés des commandes
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ServiceContainer } from './service-container';

/**
 * Command manager for handling all extension commands
 * Gestionnaire de commandes pour toutes les commandes de l'extension
 */
export class CommandManager implements vscode.Disposable {
    private readonly logger: Logger;
    private readonly context: vscode.ExtensionContext;
    private readonly serviceContainer: ServiceContainer;
    private readonly subscriptions: vscode.Disposable[] = [];
    private isInitialized = false;

    constructor(context: vscode.ExtensionContext, serviceContainer: ServiceContainer) {
        this.logger = new Logger('CommandManager');
        this.context = context;
        this.serviceContainer = serviceContainer;
        this.logger.debug('CommandManager created');
    }

    /**
     * Initialize and register all commands
     * Initialiser et enregistrer toutes les commandes
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('Commands already registered');
            return;
        }

        try {
            this.logger.info('Registering commands...');

            // Register all commands
            this.registerWebviewCommands();
            this.registerMCPCommands();
            this.registerUtilityCommands();
            this.registerTestCommands();

            this.isInitialized = true;
            this.logger.info(`✅ ${this.subscriptions.length} commands registered successfully`);

        } catch (error) {
            this.logger.error('❌ Failed to register commands:', error);
            throw error;
        }
    }

    /**
     * Register webview-related commands
     * Enregistrer les commandes liées aux webviews
     */
    private registerWebviewCommands(): void {
        this.subscriptions.push(
            vscode.commands.registerCommand('ai-analytics.openCommandBar', () => {
                vscode.commands.executeCommand('ai-command-bar.focus');
            }),

            vscode.commands.registerCommand('ai-analytics.openDashboard', () => {
                vscode.commands.executeCommand('ai-dashboard.focus');
            }),

            vscode.commands.registerCommand('ai-analytics.openCoach', () => {
                vscode.commands.executeCommand('ai-coach.focus');
            })
        );

        this.logger.debug('Webview commands registered');
    }

    /**
     * Register MCP server commands
     * Enregistrer les commandes du serveur MCP
     */
    private registerMCPCommands(): void {
        const mcpManager = this.serviceContainer.getMCPManager();

        this.subscriptions.push(
            vscode.commands.registerCommand('ai-analytics.startMCPServer', async () => {
                const success = await mcpManager.startServer();
                if (success) {
                    vscode.window.showInformationMessage('MCP Server started successfully');
                } else {
                    vscode.window.showErrorMessage('Failed to start MCP Server');
                }
            }),

            vscode.commands.registerCommand('ai-analytics.stopMCPServer', async () => {
                await mcpManager.stopServer();
                vscode.window.showInformationMessage('MCP Server stopped');
            }),

            vscode.commands.registerCommand('ai-analytics.restartMCPServer', async () => {
                const success = await mcpManager.restartServer();
                if (success) {
                    vscode.window.showInformationMessage('MCP Server restarted successfully');
                } else {
                    vscode.window.showErrorMessage('Failed to restart MCP Server');
                }
            }),

            vscode.commands.registerCommand('ai-analytics.showMCPServerStatus', () => {
                const status = mcpManager.getServerStatus();
                vscode.window.showInformationMessage(
                    `MCP Server Status: ${status.isRunning ? 'Running' : 'Stopped'}${status.pid ? ` (PID: ${status.pid})` : ''}`
                );
            })
        );

        this.logger.debug('MCP commands registered');
    }

    /**
     * Register utility commands
     * Enregistrer les commandes utilitaires
     */
    private registerUtilityCommands(): void {
        const hotReloadManager = this.serviceContainer.getHotReloadManager();
        const aiModelManager = this.serviceContainer.getAIModelManager();

        this.subscriptions.push(
            vscode.commands.registerCommand('ai-analytics.toggleHotReload', () => {
                hotReloadManager.toggle();
            }),

            vscode.commands.registerCommand('ai-analytics.selectModel', async () => {
                const selectedModel = await aiModelManager.selectOrAddModel();
                if (selectedModel) {
                    await aiModelManager.setSelectedModel(selectedModel);
                    // Model change notification will be handled by webview providers
                    // La notification de changement de modèle sera gérée par les fournisseurs de webview
                }
            })
        );

        this.logger.debug('Utility commands registered');
    }

    /**
     * Register test commands (development only)
     * Enregistrer les commandes de test (développement uniquement)
     */
    private registerTestCommands(): void {
        // Test commands can be conditionally registered based on environment
        // Les commandes de test peuvent être enregistrées conditionnellement selon l'environnement
        if (process.env['NODE_ENV'] === 'development') {
            try {
                // Import test commands dynamically to avoid production dependencies
                const { registerDeepSeekTestCommand } = require('../test/deepseek-manual-test');
                registerDeepSeekTestCommand(this.context);
                this.logger.debug('Test commands registered');
            } catch (error) {
                this.logger.debug('Test commands not available in production');
            }
        }
    }

    /**
     * Clean up all command subscriptions
     * Nettoyer toutes les souscriptions de commandes
     */
    async dispose(): Promise<void> {
        this.logger.info('Disposing command manager...');

        try {
            // Dispose all command subscriptions
            for (const subscription of this.subscriptions) {
                subscription.dispose();
            }
            this.subscriptions.length = 0;

            this.isInitialized = false;
            this.logger.info('✅ Command manager disposed successfully');

        } catch (error) {
            this.logger.error('❌ Error during command manager disposal:', error);
        }
    }

    /**
     * Get all registered command subscriptions
     * Obtenir toutes les souscriptions de commandes enregistrées
     */
    getSubscriptions(): readonly vscode.Disposable[] {
        return this.subscriptions;
    }
}