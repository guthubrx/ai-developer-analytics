/**
 * Provider Status Management
 * Gestion des statuts des providers IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';

/**
 * Status d'un provider
 */
export enum ProviderStatus {
    /** Provider connecté et fonctionnel */
    CONNECTED = 'connected',
    /** Clé API non configurée */
    UNCONFIGURED = 'unconfigured',
    /** Erreur d'authentification (401, 403) */
    AUTH_ERROR = 'auth_error',
    /** Erreur réseau ou timeout */
    NETWORK_ERROR = 'network_error',
    /** Erreur d'API (rate limit, etc.) */
    API_ERROR = 'api_error',
    /** Provider désactivé */
    DISABLED = 'disabled',
    /** Statut inconnu */
    UNKNOWN = 'unknown'
}

/**
 * Informations détaillées sur le statut d'un provider
 */
export interface ProviderStatusInfo {
    /** ID du provider */
    providerId: string;
    /** Nom du provider */
    providerName: string;
    /** Statut actuel */
    status: ProviderStatus;
    /** Message d'erreur si applicable */
    errorMessage?: string;
    /** Code d'erreur HTTP si applicable */
    errorCode?: number | undefined;
    /** Dernière vérification */
    lastChecked: Date;
    /** Temps de latence de la dernière requête réussie (ms) */
    lastLatency?: number;
    /** Suggestions d'action pour résoudre les problèmes */
    suggestions?: string[] | undefined;
}

/**
 * Erreur structurée pour les providers
 */
export class ProviderError extends Error {
    constructor(
        public providerId: string,
        public providerName: string,
        public status: ProviderStatus,
        message: string,
        public errorCode?: number,
        public suggestions?: string[]
    ) {
        super(message);
        this.name = 'ProviderError';
    }

    /**
     * Créer une ProviderError depuis une erreur HTTP
     */
    static fromHttpError(
        providerId: string,
        providerName: string,
        errorCode: number,
        errorMessage: string
    ): ProviderError {
        let status: ProviderStatus;
        let suggestions: string[] = [];

        switch (errorCode) {
            case 401:
            case 403:
                status = ProviderStatus.AUTH_ERROR;
                suggestions = [
                    `Vérifiez que votre clé API ${providerName} est correcte`,
                    `Ouvrez les paramètres : Préférences > Paramètres > AI Analytics > ${providerName} API Key`,
                    `Vérifiez que la clé n'a pas expiré sur le site de ${providerName}`,
                    `Assurez-vous d'avoir copié la clé complète sans espace`
                ];
                break;

            case 429:
                status = ProviderStatus.API_ERROR;
                suggestions = [
                    `Vous avez atteint la limite de requêtes pour ${providerName}`,
                    'Attendez quelques minutes avant de réessayer',
                    'Vérifiez votre quota sur le site du fournisseur'
                ];
                break;

            case 500:
            case 502:
            case 503:
            case 504:
                status = ProviderStatus.API_ERROR;
                suggestions = [
                    `Le service ${providerName} est temporairement indisponible`,
                    'Réessayez dans quelques instants',
                    `Vérifiez le statut du service sur le site de ${providerName}`
                ];
                break;

            default:
                status = ProviderStatus.API_ERROR;
                suggestions = [
                    `Erreur ${errorCode} du service ${providerName}`,
                    'Consultez les logs de la console pour plus de détails'
                ];
        }

        return new ProviderError(
            providerId,
            providerName,
            status,
            `${providerName} API Error ${errorCode}: ${errorMessage}`,
            errorCode,
            suggestions
        );
    }

    /**
     * Créer une ProviderError depuis une erreur réseau
     */
    static fromNetworkError(
        providerId: string,
        providerName: string,
        error: Error
    ): ProviderError {
        const suggestions = [
            'Vérifiez votre connexion Internet',
            `Vérifiez que le service ${providerName} est accessible`,
            'Vérifiez les paramètres de proxy si applicable'
        ];

        return new ProviderError(
            providerId,
            providerName,
            ProviderStatus.NETWORK_ERROR,
            `Erreur réseau avec ${providerName}: ${error.message}`,
            undefined,
            suggestions
        );
    }

    /**
     * Afficher l'erreur à l'utilisateur avec options d'action
     */
    async showToUser(): Promise<void> {
        const icon = this.getStatusIcon();
        const message = `${icon} ${this.providerName}: ${this.message}`;

        const actions: string[] = ['Voir les suggestions'];

        if (this.status === ProviderStatus.AUTH_ERROR || this.status === ProviderStatus.UNCONFIGURED) {
            actions.push('Ouvrir les paramètres');
        }

        actions.push('Ignorer');

        const selection = await vscode.window.showErrorMessage(message, ...actions);

        if (selection === 'Voir les suggestions' && this.suggestions) {
            await this.showSuggestions();
        } else if (selection === 'Ouvrir les paramètres') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                `@ext:user.ai-developer-analytics ${this.providerId}`
            );
        }
    }

    /**
     * Afficher les suggestions dans un panneau d'information
     */
    private async showSuggestions(): Promise<void> {
        if (!this.suggestions || this.suggestions.length === 0) {
            return;
        }

        const suggestionText = this.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
        const fullMessage = `${this.providerName} - Comment résoudre ce problème :\n\n${suggestionText}`;

        const items = [
            { label: 'Ouvrir les paramètres', action: 'settings' },
            { label: 'Copier les suggestions', action: 'copy' },
            { label: 'Fermer', action: 'close' }
        ];

        const selection = await vscode.window.showQuickPick(
            items.map(item => item.label),
            {
                placeHolder: fullMessage,
                title: `${this.providerName} - Suggestions de résolution`
            }
        );

        if (selection === 'Ouvrir les paramètres') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                `@ext:user.ai-developer-analytics ${this.providerId}`
            );
        } else if (selection === 'Copier les suggestions') {
            await vscode.env.clipboard.writeText(fullMessage);
            vscode.window.showInformationMessage('Suggestions copiées dans le presse-papier');
        }
    }

    /**
     * Obtenir l'icône correspondant au statut
     */
    private getStatusIcon(): string {
        switch (this.status) {
            case ProviderStatus.CONNECTED:
                return '✅';
            case ProviderStatus.UNCONFIGURED:
                return '⚙️';
            case ProviderStatus.AUTH_ERROR:
                return '🔑';
            case ProviderStatus.NETWORK_ERROR:
                return '🌐';
            case ProviderStatus.API_ERROR:
                return '⚠️';
            case ProviderStatus.DISABLED:
                return '⏸️';
            default:
                return '❓';
        }
    }
}

/**
 * Gestionnaire de statut des providers
 */
export class ProviderStatusManager {
    private static instance: ProviderStatusManager;
    private statusMap: Map<string, ProviderStatusInfo> = new Map();
    private statusBarItem: vscode.StatusBarItem;
    private webviewCallback: ((providers: ProviderStatusInfo[]) => void) | null = null;

    private constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'ai-developer-analytics.providers.showStatus';
    }

    /**
     * Obtenir l'instance singleton
     */
    static getInstance(): ProviderStatusManager {
        if (!ProviderStatusManager.instance) {
            ProviderStatusManager.instance = new ProviderStatusManager();
        }
        return ProviderStatusManager.instance;
    }

    /**
     * Enregistrer un callback pour les mises à jour vers la webview
     */
    setWebviewCallback(callback: (providers: ProviderStatusInfo[]) => void): void {
        this.webviewCallback = callback;
        // Envoyer immédiatement les statuts actuels
        if (this.statusMap.size > 0) {
            callback(this.getAllStatuses());
        }
    }

    /**
     * Désactiver le callback webview
     */
    clearWebviewCallback(): void {
        this.webviewCallback = null;
    }

    /**
     * Mettre à jour le statut d'un provider
     */
    updateStatus(info: ProviderStatusInfo): void {
        this.statusMap.set(info.providerId, info);
        this.updateStatusBar();
        console.log(`[ProviderStatus] ${info.providerName}: ${info.status}`);

        // Notifier la webview si un callback est enregistré
        if (this.webviewCallback) {
            this.webviewCallback(this.getAllStatuses());
        }
    }

    /**
     * Obtenir le statut d'un provider
     */
    getStatus(providerId: string): ProviderStatusInfo | undefined {
        return this.statusMap.get(providerId);
    }

    /**
     * Obtenir tous les statuts
     */
    getAllStatuses(): ProviderStatusInfo[] {
        return Array.from(this.statusMap.values());
    }

    /**
     * Obtenir les providers connectés
     */
    getConnectedProviders(): ProviderStatusInfo[] {
        return Array.from(this.statusMap.values()).filter(
            info => info.status === ProviderStatus.CONNECTED
        );
    }

    /**
     * Obtenir tous les statuts des providers
     */
    getAllProviderStatuses(): ProviderStatusInfo[] {
        return Array.from(this.statusMap.values());
    }

    /**
     * Obtenir les providers en erreur
     */
    getErrorProviders(): ProviderStatusInfo[] {
        return Array.from(this.statusMap.values()).filter(
            info => info.status === ProviderStatus.AUTH_ERROR ||
                   info.status === ProviderStatus.NETWORK_ERROR ||
                   info.status === ProviderStatus.API_ERROR
        );
    }

    /**
     * Mettre à jour la barre de statut
     */
    private updateStatusBar(): void {
        const connected = this.getConnectedProviders().length;
        const total = this.statusMap.size;
        const errors = this.getErrorProviders().length;

        let text = `$(cloud) ${connected}/${total} Providers`;
        let tooltip = `Providers IA: ${connected} connectés`;

        if (errors > 0) {
            text = `$(warning) ${connected}/${total} Providers (${errors} erreurs)`;
            tooltip = `Providers IA: ${connected} connectés, ${errors} en erreur. Cliquez pour plus de détails.`;
        }

        this.statusBarItem.text = text;
        this.statusBarItem.tooltip = tooltip;
        this.statusBarItem.show();
    }

    /**
     * Afficher un panneau de statut détaillé
     */
    async showStatusPanel(): Promise<void> {
        const statuses = this.getAllStatuses();

        if (statuses.length === 0) {
            vscode.window.showInformationMessage('Aucun provider configuré');
            return;
        }

        const items = statuses.map(info => {
            const icon = this.getStatusIcon(info.status);
            const latency = info.lastLatency ? ` (${info.lastLatency}ms)` : '';
            const error = info.errorMessage ? ` - ${info.errorMessage}` : '';

            return {
                label: `${icon} ${info.providerName}${latency}`,
                description: this.getStatusDescription(info.status),
                detail: error || `Dernière vérification: ${info.lastChecked.toLocaleTimeString()}`,
                providerId: info.providerId,
                status: info.status
            };
        });

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Statut des providers IA',
            title: 'Providers IA - Statut détaillé'
        });

        if (selection) {
            const info = this.statusMap.get(selection.providerId);
            if (info && info.suggestions) {
                await this.showProviderDetails(info);
            }
        }
    }

    /**
     * Afficher les détails d'un provider
     */
    private async showProviderDetails(info: ProviderStatusInfo): Promise<void> {
        const messages: string[] = [
            `Provider: ${info.providerName}`,
            `Statut: ${this.getStatusDescription(info.status)}`,
            `Dernière vérification: ${info.lastChecked.toLocaleString()}`
        ];

        if (info.lastLatency) {
            messages.push(`Latence: ${info.lastLatency}ms`);
        }

        if (info.errorMessage) {
            messages.push(`Erreur: ${info.errorMessage}`);
        }

        if (info.suggestions && info.suggestions.length > 0) {
            messages.push('', 'Suggestions:');
            info.suggestions.forEach((s, i) => {
                messages.push(`${i + 1}. ${s}`);
            });
        }

        const actions = ['Ouvrir les paramètres', 'Copier les détails', 'Fermer'];
        const selection = await vscode.window.showInformationMessage(
            messages.join('\n'),
            ...actions
        );

        if (selection === 'Ouvrir les paramètres') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                `@ext:user.ai-developer-analytics ${info.providerId}`
            );
        } else if (selection === 'Copier les détails') {
            await vscode.env.clipboard.writeText(messages.join('\n'));
            vscode.window.showInformationMessage('Détails copiés dans le presse-papier');
        }
    }

    /**
     * Obtenir l'icône correspondant au statut
     */
    private getStatusIcon(status: ProviderStatus): string {
        switch (status) {
            case ProviderStatus.CONNECTED:
                return '✅';
            case ProviderStatus.UNCONFIGURED:
                return '⚙️';
            case ProviderStatus.AUTH_ERROR:
                return '🔑';
            case ProviderStatus.NETWORK_ERROR:
                return '🌐';
            case ProviderStatus.API_ERROR:
                return '⚠️';
            case ProviderStatus.DISABLED:
                return '⏸️';
            default:
                return '❓';
        }
    }

    /**
     * Obtenir la description du statut
     */
    private getStatusDescription(status: ProviderStatus): string {
        switch (status) {
            case ProviderStatus.CONNECTED:
                return 'Connecté';
            case ProviderStatus.UNCONFIGURED:
                return 'Non configuré';
            case ProviderStatus.AUTH_ERROR:
                return 'Erreur d\'authentification';
            case ProviderStatus.NETWORK_ERROR:
                return 'Erreur réseau';
            case ProviderStatus.API_ERROR:
                return 'Erreur API';
            case ProviderStatus.DISABLED:
                return 'Désactivé';
            default:
                return 'Statut inconnu';
        }
    }

    /**
     * Nettoyer les ressources
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}
