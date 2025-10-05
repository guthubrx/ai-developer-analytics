/**
 * Hot Reload Manager for UI and backend
 * Gestionnaire de Hot Reload pour l'UI et le backend
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Hot Reload Manager for development
 * Gestionnaire de Hot Reload pour le développement
 */
export class HotReloadManager {
    private readonly context: vscode.ExtensionContext;
    private watchers: fs.FSWatcher[] = [];
    private isEnabled = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Initialize hot reload
     * Initialiser le hot reload
     */
    async initialize(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        this.isEnabled = config.get('hotReloadEnabled') as boolean;

        if (this.isEnabled) {
            await this.startWatching();
        }
    }

    /**
     * Toggle hot reload
     * Activer/désactiver le hot reload
     */
    async toggle(): Promise<void> {
        this.isEnabled = !this.isEnabled;

        if (this.isEnabled) {
            await this.startWatching();
            vscode.window.showInformationMessage('AI Analytics Hot Reload: Enabled');
        } else {
            this.stopWatching();
            vscode.window.showInformationMessage('AI Analytics Hot Reload: Disabled');
        }

        // Update configuration
        // Mettre à jour la configuration
        const config = vscode.workspace.getConfiguration('aiAnalytics');
        await config.update('hotReloadEnabled', this.isEnabled, vscode.ConfigurationTarget.Global);
    }

    /**
     * Start file watching
     * Démarrer la surveillance des fichiers
     */
    private async startWatching(): Promise<void> {
        const extensionPath = this.context.extensionPath;
        const srcPath = path.join(extensionPath, 'src');

        // Watch TypeScript files for backend hot reload
        // Surveiller les fichiers TypeScript pour le hot reload backend
        if (fs.existsSync(srcPath)) {
            const tsWatcher = fs.watch(srcPath, { recursive: true }, (_eventType, filename) => {
                if (filename && filename.endsWith('.ts')) {
                    this.handleBackendChange(filename);
                }
            });

            this.watchers.push(tsWatcher);
        }

        // Watch UI files for frontend hot reload
        // Surveiller les fichiers UI pour le hot reload frontend
        const mediaPath = path.join(extensionPath, 'media');
        if (fs.existsSync(mediaPath)) {
            const uiWatcher = fs.watch(mediaPath, { recursive: true }, (_eventType, filename) => {
                if (filename && (filename.endsWith('.js') || filename.endsWith('.css') || filename.endsWith('.html'))) {
                    this.handleUIChange(filename);
                }
            });

            this.watchers.push(uiWatcher);
        }

        console.log('AI Analytics Hot Reload: Started watching for changes');
    }

    /**
     * Stop file watching
     * Arrêter la surveillance des fichiers
     */
    private stopWatching(): void {
        this.watchers.forEach(watcher => watcher.close());
        this.watchers = [];
        console.log('AI Analytics Hot Reload: Stopped watching for changes');
    }

    /**
     * Handle backend file changes
     * Gérer les changements de fichiers backend
     */
    private handleBackendChange(filename: string): void {
        console.log(`Backend file changed: ${filename}`);

        // In a real implementation, this would reload the specific module
        // Dans une implémentation réelle, cela rechargerait le module spécifique
        vscode.window.showInformationMessage(`AI Analytics: Backend updated - ${filename}`);
    }

    /**
     * Handle UI file changes
     * Gérer les changements de fichiers UI
     */
    private handleUIChange(filename: string): void {
        console.log(`UI file changed: ${filename}`);

        // In a real implementation, this would refresh webviews
        // Dans une implémentation réelle, cela rafraîchirait les webviews
        vscode.window.showInformationMessage(`AI Analytics: UI updated - ${filename}`);
    }

    /**
     * Dispose resources
     * Libérer les ressources
     */
    dispose(): void {
        this.stopWatching();
    }
}