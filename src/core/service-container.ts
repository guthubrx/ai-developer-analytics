/**
 * Service Container - Dependency injection and service management
 * Conteneur de Services - Injection de dépendances et gestion des services
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { AnalyticsManager } from '../analytics/manager';
import { AIClientManager } from '../ai/clients/manager';
import { AIRouter } from '../ai/router/router';
import { AICoach } from '../coaching/coach';
import { HotReloadManager } from '../hot-reload/manager';
import { MCPManager } from '../mcp/mcp-manager';
import { SessionManager } from '../sessions/manager';
import { AIModelManager } from '../ai/model-manager';

/**
 * Service container for dependency injection
 * Conteneur de services pour l'injection de dépendances
 */
export class ServiceContainer implements vscode.Disposable {
    private readonly logger: Logger;
    private readonly context: vscode.ExtensionContext;

    // Core services
    private analyticsManager: AnalyticsManager | null = null;
    private aiClientManager: AIClientManager | null = null;
    private aiRouter: AIRouter | null = null;
    private aiCoach: AICoach | null = null;
    private hotReloadManager: HotReloadManager | null = null;
    private mcpManager: MCPManager | null = null;
    private sessionManager: SessionManager | null = null;
    private aiModelManager: AIModelManager | null = null;

    private isInitialized = false;

    constructor(context: vscode.ExtensionContext) {
        this.logger = new Logger('ServiceContainer');
        this.context = context;
        this.logger.debug('ServiceContainer created');
    }

    /**
     * Initialize all services
     * Initialiser tous les services
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('Services already initialized');
            return;
        }

        try {
            this.logger.info('Initializing services...');

            // Initialize services in dependency order
            this.analyticsManager = new AnalyticsManager(this.context);
            this.aiClientManager = new AIClientManager(this.context);
            this.aiRouter = new AIRouter(this.aiClientManager, this.analyticsManager);
            this.aiCoach = new AICoach(this.analyticsManager, this.aiRouter);
            this.hotReloadManager = new HotReloadManager(this.context);
            this.mcpManager = new MCPManager(this.context);
            this.sessionManager = new SessionManager(this.context);
            this.aiModelManager = new AIModelManager(this.context);

            // Initialize services that need async setup
            await this.initializeAsyncServices();

            this.isInitialized = true;
            this.logger.info('✅ Services initialized successfully');

        } catch (error) {
            this.logger.error('❌ Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Initialize services that require async operations
     * Initialiser les services nécessitant des opérations asynchrones
     */
    private async initializeAsyncServices(): Promise<void> {
        const promises: Promise<void>[] = [];

        // Analytics manager
        if (this.analyticsManager) {
            promises.push(
                Promise.race([
                    this.analyticsManager.initialize(),
                    new Promise<void>((_, reject) =>
                        setTimeout(() => reject(new Error('Analytics init timeout')), 5000)
                    )
                ]).catch(error => {
                    this.logger.warn(`Analytics initialization failed, continuing without: ${error}`);
                }) as Promise<void>
            );
        }

        // AI Client manager
        if (this.aiClientManager) {
            promises.push(
                this.aiClientManager.initialize().catch(error => {
                    this.logger.error('AI Client initialization failed:', error);
                })
            );
        }

        // Hot reload manager
        if (this.hotReloadManager) {
            const config = vscode.workspace.getConfiguration('aiAnalytics');
            if (config.get('hotReloadEnabled')) {
                promises.push(
                    Promise.race([
                        this.hotReloadManager.initialize(),
                        new Promise<void>((_, reject) =>
                            setTimeout(() => reject(new Error('Hot reload timeout')), 5000)
                        )
                    ]).catch(error => {
                        this.logger.warn(`Hot reload initialization failed: ${error}`);
                    }) as Promise<void>
                );
            }
        }

        // Wait for all async initializations
        await Promise.allSettled(promises);
    }

    /**
     * Clean up all services
     * Nettoyer tous les services
     */
    async dispose(): Promise<void> {
        this.logger.info('Disposing services...');

        try {
            // Dispose services in reverse order
            const disposePromises: Promise<void>[] = [];

            if (this.mcpManager) {
                disposePromises.push(this.mcpManager.dispose());
            }

            if (this.hotReloadManager) {
                disposePromises.push(Promise.resolve(this.hotReloadManager.dispose()));
            }

            if (this.analyticsManager) {
                disposePromises.push(this.analyticsManager.close());
            }

            await Promise.allSettled(disposePromises);

            // Clear references
            this.analyticsManager = null;
            this.aiClientManager = null;
            this.aiRouter = null;
            this.aiCoach = null;
            this.hotReloadManager = null;
            this.mcpManager = null;
            this.sessionManager = null;
            this.aiModelManager = null;

            this.isInitialized = false;
            this.logger.info('✅ Services disposed successfully');

        } catch (error) {
            this.logger.error('❌ Error during service disposal:', error);
        }
    }

    // Service getters with null checks
    getAnalyticsManager(): AnalyticsManager {
        if (!this.analyticsManager) {
            throw new Error('AnalyticsManager not initialized');
        }
        return this.analyticsManager;
    }

    getAIClientManager(): AIClientManager {
        if (!this.aiClientManager) {
            throw new Error('AIClientManager not initialized');
        }
        return this.aiClientManager;
    }

    getAIRouter(): AIRouter {
        if (!this.aiRouter) {
            throw new Error('AIRouter not initialized');
        }
        return this.aiRouter;
    }

    getAICoach(): AICoach {
        if (!this.aiCoach) {
            throw new Error('AICoach not initialized');
        }
        return this.aiCoach;
    }

    getHotReloadManager(): HotReloadManager {
        if (!this.hotReloadManager) {
            throw new Error('HotReloadManager not initialized');
        }
        return this.hotReloadManager;
    }

    getMCPManager(): MCPManager {
        if (!this.mcpManager) {
            throw new Error('MCPManager not initialized');
        }
        return this.mcpManager;
    }

    getSessionManager(): SessionManager {
        if (!this.sessionManager) {
            throw new Error('SessionManager not initialized');
        }
        return this.sessionManager;
    }

    getAIModelManager(): AIModelManager {
        if (!this.aiModelManager) {
            throw new Error('AIModelManager not initialized');
        }
        return this.aiModelManager;
    }
}