/**
 * Webview Manager - Centralized webview provider management
 * Gestionnaire de Webviews - Gestion centralisée des fournisseurs de webview
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ServiceContainer } from './service-container';
import { AICommandBarProvider } from '../ui/sidebar/command-bar-provider';
import { AIDashboardProvider } from '../ui/dashboards/dashboard-provider';
import { AICoachProvider } from '../ui/dashboards/coach-provider';

/**
 * Webview manager for handling all webview providers
 * Gestionnaire de webviews pour tous les fournisseurs de webview
 */
export class WebviewManager implements vscode.Disposable {
    private readonly logger: Logger;
    private readonly context: vscode.ExtensionContext;
    private readonly serviceContainer: ServiceContainer;
    private readonly subscriptions: vscode.Disposable[] = [];

    // Webview providers
    private commandBarProvider: AICommandBarProvider | null = null;
    private dashboardProvider: AIDashboardProvider | null = null;
    private coachProvider: AICoachProvider | null = null;

    private isInitialized = false;

    constructor(context: vscode.ExtensionContext, serviceContainer: ServiceContainer) {
        this.logger = new Logger('WebviewManager');
        this.context = context;
        this.serviceContainer = serviceContainer;
        this.logger.debug('WebviewManager created');
    }

    /**
     * Initialize and register all webview providers
     * Initialiser et enregistrer tous les fournisseurs de webview
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('Webviews already registered');
            return;
        }

        try {
            this.logger.info('Registering webview providers...');

            // Create webview providers
            this.createWebviewProviders();

            // Register webview providers
            this.registerWebviewProviders();

            this.isInitialized = true;
            this.logger.info(`✅ ${this.subscriptions.length} webview providers registered successfully`);

        } catch (error) {
            this.logger.error('❌ Failed to register webview providers:', error);
            throw error;
        }
    }

    /**
     * Create all webview provider instances
     * Créer toutes les instances de fournisseurs de webview
     */
    private createWebviewProviders(): void {
        const {
            getAIRouter,
            getAnalyticsManager,
            getAICoach,
            getSessionManager
        } = this.serviceContainer;

        // Command Bar Provider
        this.commandBarProvider = new AICommandBarProvider(
            this.context.extensionUri,
            getAIRouter(),
            getAnalyticsManager(),
            getAICoach(),
            getSessionManager(),
            this.context
        );

        // Dashboard Provider
        this.dashboardProvider = new AIDashboardProvider(
            this.context.extensionUri,
            getAnalyticsManager(),
            getAICoach()
        );

        // Coach Provider
        this.coachProvider = new AICoachProvider(
            this.context.extensionUri,
            getAICoach()
        );

        this.logger.debug('Webview provider instances created');
    }

    /**
     * Register all webview providers with VS Code
     * Enregistrer tous les fournisseurs de webview avec VS Code
     */
    private registerWebviewProviders(): void {
        if (!this.commandBarProvider || !this.dashboardProvider || !this.coachProvider) {
            throw new Error('Webview providers not created');
        }

        // Register webview providers
        this.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'ai-command-bar',
                this.commandBarProvider
            ),

            vscode.window.registerWebviewViewProvider(
                'ai-dashboard',
                this.dashboardProvider
            ),

            vscode.window.registerWebviewViewProvider(
                'ai-coach',
                this.coachProvider
            )
        );

        this.logger.debug('Webview providers registered with VS Code');
    }

    /**
     * Clean up all webview providers
     * Nettoyer tous les fournisseurs de webview
     */
    async dispose(): Promise<void> {
        this.logger.info('Disposing webview manager...');

        try {
            // Dispose webview providers
            if (this.commandBarProvider) {
                await this.commandBarProvider.dispose();
                this.commandBarProvider = null;
            }

            if (this.dashboardProvider) {
                await this.dashboardProvider.dispose();
                this.dashboardProvider = null;
            }

            if (this.coachProvider) {
                await this.coachProvider.dispose();
                this.coachProvider = null;
            }

            // Dispose subscriptions
            for (const subscription of this.subscriptions) {
                subscription.dispose();
            }
            this.subscriptions.length = 0;

            this.isInitialized = false;
            this.logger.info('✅ Webview manager disposed successfully');

        } catch (error) {
            this.logger.error('❌ Error during webview manager disposal:', error);
        }
    }

    /**
     * Get command bar provider
     * Obtenir le fournisseur de barre de commande
     */
    getCommandBarProvider(): AICommandBarProvider {
        if (!this.commandBarProvider) {
            throw new Error('CommandBarProvider not initialized');
        }
        return this.commandBarProvider;
    }

    /**
     * Get dashboard provider
     * Obtenir le fournisseur de tableau de bord
     */
    getDashboardProvider(): AIDashboardProvider {
        if (!this.dashboardProvider) {
            throw new Error('DashboardProvider not initialized');
        }
        return this.dashboardProvider;
    }

    /**
     * Get coach provider
     * Obtenir le fournisseur de coach
     */
    getCoachProvider(): AICoachProvider {
        if (!this.coachProvider) {
            throw new Error('CoachProvider not initialized');
        }
        return this.coachProvider;
    }

    /**
     * Get all registered webview subscriptions
     * Obtenir toutes les souscriptions de webview enregistrées
     */
    getSubscriptions(): readonly vscode.Disposable[] {
        return this.subscriptions;
    }
}