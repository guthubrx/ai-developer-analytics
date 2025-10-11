/**
 * Main extension entry point for AI Developer Analytics
 * Point d'entrée principal de l'extension pour l'analyse des développeurs IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { AIClientManager } from './ai/clients/manager';
import { AIRouter } from './ai/router/router';
import { AnalyticsManager } from './analytics/manager';
import { AICoach } from './coaching/coach';
import { HotReloadManager } from './hot-reload/manager';
import { AICommandBarProvider } from './ui/sidebar/command-bar-provider';
import { AIDashboardProvider } from './ui/dashboards/dashboard-provider';
import { AICoachProvider } from './ui/dashboards/coach-provider';
import { registerDeepSeekTestCommand } from './test/deepseek-manual-test';
import { MCPManager } from './mcp/mcp-manager';
import { SessionManager } from './sessions/manager';
import { AIModelManager } from './ai/model-manager';
import { ProviderManager } from './ai/providers/provider-manager';
import {
    registerProviderDiagnosticCommand,
    registerProviderExportCommand,
    registerProviderValidationCommand
} from './ai/providers/diagnostic';

/**
 * Extension activation function
 * Fonction d'activation de l'extension
 */
// Global reference to MCP manager for deactivation
let mcpManager: MCPManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('✅ [ACTIVATION] AI Developer Analytics extension is now active!');

    try {
        // Initialize core managers
        // Initialiser les gestionnaires principaux
        console.log('📦 [ACTIVATION] Creating managers...');
        
        const analyticsManager = new AnalyticsManager(context);
        console.log('✓ AnalyticsManager created');
        
        const aiClientManager = new AIClientManager(context);
        console.log('✓ AIClientManager created');
        
        // Initialize AI clients asynchronously but don't block activation
        aiClientManager.initialize().catch(error => {
            console.error('❌ Failed to initialize AI clients:', error);
        });
        
        const aiRouter = new AIRouter(aiClientManager, analyticsManager);
        console.log('✓ AIRouter created');
        
        const aiCoach = new AICoach(analyticsManager, aiRouter);
        console.log('✓ AICoach created');
        
        const hotReloadManager = new HotReloadManager(context);
        console.log('✓ HotReloadManager created');
        
        mcpManager = new MCPManager(context);
        console.log('✓ MCPManager created');
        
        const sessionManager = new SessionManager(context);
        console.log('✓ SessionManager created');
        
        const aiModelManager = new AIModelManager(context);
        console.log('✓ AIModelManager created');

        const providerManager = new ProviderManager(context);
        await providerManager.initialize();
        console.log('✓ ProviderManager created');

        // Register webview providers
        // Enregistrer les fournisseurs de webview
        console.log('🎨 [ACTIVATION] Creating webview providers...');
        
        const commandBarProvider = new AICommandBarProvider(
            context.extensionUri,
            aiRouter,
            analyticsManager,
            aiCoach,
            sessionManager,
            context
        );
        console.log('✓ CommandBarProvider created');

        const dashboardProvider = new AIDashboardProvider(
            context.extensionUri,
            analyticsManager,
            aiCoach
        );
        console.log('✓ DashboardProvider created');

        const coachProvider = new AICoachProvider(
            context.extensionUri,
            aiCoach
        );
        console.log('✓ CoachProvider created');

        // Register views
        // Enregistrer les vues
        console.log('📝 [ACTIVATION] Registering webview providers...');
        
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'ai-command-bar',
                commandBarProvider
            )
        );
        console.log('✓ ai-command-bar registered');
        
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'ai-dashboard',
                dashboardProvider
            )
        );
        console.log('✓ ai-dashboard registered');
        
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'ai-coach',
                coachProvider
            )
        );
        console.log('✓ ai-coach registered');

        // Register commands
        // Enregistrer les commandes
        console.log('⚙️  [ACTIVATION] Registering commands...');
        
        context.subscriptions.push(
        vscode.commands.registerCommand('ai-analytics.openCommandBar', () => {
            vscode.commands.executeCommand('ai-command-bar.focus');
        }),
        vscode.commands.registerCommand('ai-analytics.openDashboard', () => {
            vscode.commands.executeCommand('ai-dashboard.focus');
        }),
        vscode.commands.registerCommand('ai-analytics.openCoach', () => {
            vscode.commands.executeCommand('ai-coach.focus');
        }),
        vscode.commands.registerCommand('ai-analytics.toggleHotReload', () => {
            hotReloadManager.toggle();
        }),
        vscode.commands.registerCommand('ai-analytics.showTestResults', (results: any) => {
            commandBarProvider.showTestResults(results);
        }),
        vscode.commands.registerCommand('ai-analytics.startMCPServer', async () => {
            if (!mcpManager) {
                vscode.window.showErrorMessage('MCP Manager not initialized');
                return;
            }
            const success = await mcpManager.startServer();
            if (success) {
                vscode.window.showInformationMessage('MCP Server started successfully');
            } else {
                vscode.window.showErrorMessage('Failed to start MCP Server');
            }
        }),
        vscode.commands.registerCommand('ai-analytics.stopMCPServer', async () => {
            if (!mcpManager) {
                vscode.window.showErrorMessage('MCP Manager not initialized');
                return;
            }
            await mcpManager.stopServer();
            vscode.window.showInformationMessage('MCP Server stopped');
        }),
        vscode.commands.registerCommand('ai-analytics.restartMCPServer', async () => {
            if (!mcpManager) {
                vscode.window.showErrorMessage('MCP Manager not initialized');
                return;
            }
            const success = await mcpManager.restartServer();
            if (success) {
                vscode.window.showInformationMessage('MCP Server restarted successfully');
            } else {
                vscode.window.showErrorMessage('Failed to restart MCP Server');
            }
        }),
        vscode.commands.registerCommand('ai-analytics.showMCPServerStatus', () => {
            if (!mcpManager) {
                vscode.window.showErrorMessage('MCP Manager not initialized');
                return;
            }
            const status = mcpManager.getServerStatus();
            vscode.window.showInformationMessage(
                `MCP Server Status: ${status.isRunning ? 'Running' : 'Stopped'}${status.pid ? ` (PID: ${status.pid})` : ''}`
            );
        }),
        vscode.commands.registerCommand('ai-analytics.selectModel', async () => {
            const selectedModel = await aiModelManager.selectOrAddModel();
            if (selectedModel) {
                await aiModelManager.setSelectedModel(selectedModel);
                // Notify webview providers about model change
                // Notifier les fournisseurs de webview du changement de modèle
                commandBarProvider.updateSelectedModel(selectedModel);
            }
        })
        );
        console.log('✓ All commands registered');

        // Register test commands (development only)
        // Enregistrer les commandes de test (développement uniquement)
        console.log('🧪 [ACTIVATION] Registering test commands...');
        registerDeepSeekTestCommand(context);
        console.log('✓ Test commands registered');

        // Register provider diagnostic commands
        // Enregistrer les commandes de diagnostic des providers
        console.log('🔍 [ACTIVATION] Registering provider diagnostic commands...');
        registerProviderDiagnosticCommand(context);
        registerProviderExportCommand(context);
        registerProviderValidationCommand(context);
        console.log('✓ Provider diagnostic commands registered');

        // Initialize hot reload if enabled
        // Initialiser le hot reload si activé
        console.log('🔄 [ACTIVATION] Checking hot reload...');
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        if (config.get('hotReloadEnabled')) {
            try {
                await Promise.race([
                    hotReloadManager.initialize(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Hot reload timeout')), 5000))
                ]);
                console.log('✓ Hot reload initialized');
            } catch (error) {
                console.error('❌ Failed to initialize hot reload:', error);
            }
        } else {
            console.log('⊘ Hot reload disabled');
        }

        // Start analytics collection
        // Démarrer la collecte d'analyses
        console.log('📊 [ACTIVATION] Initializing analytics...');
        try {
            await Promise.race([
                analyticsManager.initialize(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Analytics init timeout')), 5000))
            ]);
            console.log('✓ Analytics initialized');
        } catch (error) {
            console.error('❌ Failed to initialize analytics:', error);
            // Continue without analytics if initialization fails
        }

        console.log('✅ [ACTIVATION] AI Developer Analytics extension initialized successfully!');
    } catch (error) {
        console.error('❌ [ACTIVATION] Critical error during activation:', error);
        vscode.window.showErrorMessage(`Failed to activate AI Developer Analytics: ${error instanceof Error ? error.message : error}`);
        throw error;
    }
}

/**
 * Extension deactivation function
 * Fonction de désactivation de l'extension
 */
export async function deactivate() {
    console.log('AI Developer Analytics extension is now deactivated');

    // Stop MCP server if running
    // Arrêter le serveur MCP s'il est en cours d'exécution
    if (mcpManager) {
        await mcpManager.dispose();
        mcpManager = null;
    }
}