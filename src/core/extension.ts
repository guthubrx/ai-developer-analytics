/**
 * AI Developer Analytics Extension - Core Activation
 * Extension d'Analyse des Développeurs IA - Activation Principale
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import { ExtensionManager } from './extension-manager';
import { Logger } from '../utils/logger';

/**
 * Extension activation function
 * Fonction d'activation de l'extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const logger = new Logger('Extension');

    try {
        logger.info('Starting AI Developer Analytics extension activation...');

        // Create and initialize extension manager
        const extensionManager = new ExtensionManager(context);
        await extensionManager.initialize();

        // Store manager in context for deactivation
        context.globalState.update('extensionManager', extensionManager);

        logger.info('✅ AI Developer Analytics extension activated successfully!');

    } catch (error) {
        logger.error('❌ Critical error during extension activation:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(
            `Failed to activate AI Developer Analytics: ${errorMessage}`
        );

        throw error;
    }
}

/**
 * Extension deactivation function
 * Fonction de désactivation de l'extension
 */
export async function deactivate(): Promise<void> {
    const logger = new Logger('Extension');

    try {
        logger.info('Deactivating AI Developer Analytics extension...');

        // Cleanup is handled by ExtensionManager dispose method
        // Le nettoyage est géré par la méthode dispose de ExtensionManager

        logger.info('✅ AI Developer Analytics extension deactivated successfully!');

    } catch (error) {
        logger.error('❌ Error during extension deactivation:', error);
    }
}