/**
 * Extension Manager - Centralized extension lifecycle management
 * Gestionnaire d'Extension - Gestion centralisée du cycle de vie
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ServiceContainer } from './service-container';
import { CommandManager } from './command-manager';
import { WebviewManager } from './webview-manager';

/**
 * Main extension manager coordinating all components
 * Gestionnaire principal coordonnant tous les composants
 */
export class ExtensionManager implements vscode.Disposable {
    private readonly logger: Logger;
    private readonly context: vscode.ExtensionContext;
    private readonly serviceContainer: ServiceContainer;
    private readonly commandManager: CommandManager;
    private readonly webviewManager: WebviewManager;
    private isInitialized = false;

    constructor(context: vscode.ExtensionContext) {
        this.logger = new Logger('ExtensionManager');
        this.context = context;

        // Initialize managers
        this.serviceContainer = new ServiceContainer(context);
        this.commandManager = new CommandManager(context, this.serviceContainer);
        this.webviewManager = new WebviewManager(context, this.serviceContainer);

        this.logger.debug('ExtensionManager created');
    }

    /**
     * Initialize all extension components
     * Initialiser tous les composants de l'extension
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('Extension already initialized');
            return;
        }

        try {
            this.logger.info('Initializing extension components...');

            // Step 1: Initialize services
            await this.serviceContainer.initialize();

            // Step 2: Register commands
            await this.commandManager.initialize();

            // Step 3: Register webviews
            await this.webviewManager.initialize();

            // Step 4: Set up subscriptions
            this.setupSubscriptions();

            this.isInitialized = true;
            this.logger.info('✅ Extension components initialized successfully');

        } catch (error) {
            this.logger.error('❌ Failed to initialize extension components:', error);
            throw error;
        }
    }

    /**
     * Set up all subscriptions for cleanup
     * Configurer toutes les souscriptions pour le nettoyage
     */
    private setupSubscriptions(): void {
        // Add all managers to context subscriptions for automatic disposal
        this.context.subscriptions.push(
            this,
            this.serviceContainer,
            this.commandManager,
            this.webviewManager
        );

        this.logger.debug('Extension subscriptions configured');
    }

    /**
     * Clean up all resources
     * Nettoyer toutes les ressources
     */
    async dispose(): Promise<void> {
        this.logger.info('Disposing extension manager...');

        try {
            // Dispose in reverse order of initialization
            await this.webviewManager.dispose();
            await this.commandManager.dispose();
            await this.serviceContainer.dispose();

            this.isInitialized = false;
            this.logger.info('✅ Extension manager disposed successfully');

        } catch (error) {
            this.logger.error('❌ Error during extension manager disposal:', error);
        }
    }

    /**
     * Get service container for external access
     * Obtenir le conteneur de services pour accès externe
     */
    getServices(): ServiceContainer {
        return this.serviceContainer;
    }

    /**
     * Get command manager for external access
     * Obtenir le gestionnaire de commandes pour accès externe
     */
    getCommands(): CommandManager {
        return this.commandManager;
    }

    /**
     * Get webview manager for external access
     * Obtenir le gestionnaire de webviews pour accès externe
     */
    getWebviews(): WebviewManager {
        return this.webviewManager;
    }
}