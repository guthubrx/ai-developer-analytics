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

/**
 * Extension activation function
 * Fonction d'activation de l'extension
 */
// Global reference to MCP manager for deactivation
let mcpManager: MCPManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('AI Developer Analytics extension is now active!');

    // Initialize core managers
    // Initialiser les gestionnaires principaux
    const analyticsManager = new AnalyticsManager(context);
    const aiClientManager = new AIClientManager(context);
    const aiRouter = new AIRouter(aiClientManager, analyticsManager);
    const aiCoach = new AICoach(analyticsManager, aiRouter);
    const hotReloadManager = new HotReloadManager(context);
    mcpManager = new MCPManager(context);

    // Register webview providers
    // Enregistrer les fournisseurs de webview
    const commandBarProvider = new AICommandBarProvider(
        context.extensionUri,
        aiRouter,
        analyticsManager,
        aiCoach
    );

    const dashboardProvider = new AIDashboardProvider(
        context.extensionUri,
        analyticsManager,
        aiCoach
    );

    const coachProvider = new AICoachProvider(
        context.extensionUri,
        aiCoach
    );

    // Register views
    // Enregistrer les vues
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'ai-command-bar',
            commandBarProvider
        ),
        vscode.window.registerWebviewViewProvider(
            'ai-dashboard',
            dashboardProvider
        ),
        vscode.window.registerWebviewViewProvider(
            'ai-coach',
            coachProvider
        )
    );

    // Register commands
    // Enregistrer les commandes
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
        })
    );

    // Register test commands (development only)
    // Enregistrer les commandes de test (développement uniquement)
    registerDeepSeekTestCommand(context);

    // Initialize hot reload if enabled
    // Initialiser le hot reload si activé
    const config = vscode.workspace.getConfiguration('aiAnalytics');
    if (config.get('hotReloadEnabled')) {
        await hotReloadManager.initialize();
    }

    // Start analytics collection
    // Démarrer la collecte d'analyses
    await analyticsManager.initialize();

    console.log('AI Developer Analytics extension initialized successfully');
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