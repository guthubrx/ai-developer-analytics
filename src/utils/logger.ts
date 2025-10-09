/**
 * Logger utility for the extension
 * Utilitaire de journalisation pour l'extension
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';

/**
 * Logger class for extension logging
 * Classe Logger pour la journalisation de l'extension
 */
export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;

    public constructor(name?: string) {
        const channelName = name ? `AI Analytics - ${name}` : 'AI Analytics';
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Log information message
     * Journaliser un message d'information
     */
    public info(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[INFO ${timestamp}] ${message}`);
    }

    /**
     * Log warning message
     * Journaliser un message d'avertissement
     */
    public warn(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[WARN ${timestamp}] ${message}`);
    }

    /**
     * Log error message
     * Journaliser un message d'erreur
     */
    public error(message: string, error?: unknown): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[ERROR ${timestamp}] ${message}`);
        if (error instanceof Error) {
            this.outputChannel.appendLine(`Stack: ${error.stack}`);
        } else if (error) {
            this.outputChannel.appendLine(`Error: ${String(error)}`);
        }
    }

    /**
     * Log debug message (only in development)
     * Journaliser un message de débogage (uniquement en développement)
     */
    public debug(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[DEBUG ${timestamp}] ${message}`);
    }

    /**
     * Show the output channel
     * Afficher le canal de sortie
     */
    public show(): void {
        this.outputChannel.show();
    }

    /**
     * Dispose the logger
     * Libérer le logger
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}

// Export singleton instance
// Exporter l'instance singleton
export const logger = Logger.getInstance();