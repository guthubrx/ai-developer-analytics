/**
 * AI Model Manager
 * Gestionnaire de modèles d'IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';

/**
 * Default AI models
 * Modèles d'IA par défaut
 */
const DEFAULT_MODELS = [
    "GPT-5",
    "Claude 3.5",
    "DeepSeek R1",
    "Gemini 1.5",
    "Mistral Large"
];

/**
 * AI Model Manager class
 * Classe de gestion des modèles d'IA
 */
export class AIModelManager {
    private context: vscode.ExtensionContext;
    private models: string[];

    /**
     * Constructor
     * Constructeur
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.models = this.loadModels();
    }

    /**
     * Load models from global state
     * Charger les modèles depuis l'état global
     */
    private loadModels(): string[] {
        const customModels = this.context.globalState.get<string[]>('customModels', []);
        return [...DEFAULT_MODELS, ...customModels];
    }

    /**
     * Save models to global state
     * Sauvegarder les modèles dans l'état global
     */
    private async saveModels(): Promise<void> {
        const customModels = this.models.filter(model => !DEFAULT_MODELS.includes(model));
        await this.context.globalState.update('customModels', customModels);
    }

    /**
     * Get all available models
     * Obtenir tous les modèles disponibles
     */
    getModels(): string[] {
        return [...this.models];
    }

    /**
     * Add a new model
     * Ajouter un nouveau modèle
     */
    async addModel(modelName: string): Promise<boolean> {
        if (!modelName || modelName.trim() === '') {
            return false;
        }

        const trimmedName = modelName.trim();

        // Check if model already exists
        // Vérifier si le modèle existe déjà
        if (this.models.includes(trimmedName)) {
            vscode.window.showWarningMessage(`Le modèle "${trimmedName}" existe déjà.`);
            return false;
        }

        // Add model and save
        // Ajouter le modèle et sauvegarder
        this.models.push(trimmedName);
        await this.saveModels();

        vscode.window.showInformationMessage(`✅ Modèle ajouté : ${trimmedName}`);
        return true;
    }

    /**
     * Select or add a model
     * Sélectionner ou ajouter un modèle
     */
    async selectOrAddModel(): Promise<string | undefined> {
        // Create quick pick items
        // Créer les éléments du menu déroulant
        const quickPickItems: vscode.QuickPickItem[] = [
            ...this.models.map(model => ({
                label: model,
                description: 'Modèle d\'IA'
            })),
            {
                label: '➕ Ajouter un modèle…',
                description: 'Ajouter un nouveau modèle personnalisé',
                alwaysShow: true
            }
        ];

        // Show quick pick
        // Afficher le menu déroulant
        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: '🤖 Sélectionnez un modèle d\'IA',
            title: 'Sélection de modèle d\'IA'
        });

        if (!selected) {
            return undefined;
        }

        // Handle model selection
        // Gérer la sélection de modèle
        if (selected.label !== '➕ Ajouter un modèle…') {
            vscode.window.showInformationMessage(`🧠 Modèle sélectionné : ${selected.label}`);
            return selected.label;
        }

        // Handle add model
        // Gérer l'ajout de modèle
        const newModelName = await vscode.window.showInputBox({
            placeHolder: '🆕 Entrez le nom du nouveau modèle d\'IA',
            prompt: 'Nom du nouveau modèle d\'IA',
            title: 'Ajouter un modèle d\'IA',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Le nom du modèle ne peut pas être vide';
                }
                if (this.models.includes(value.trim())) {
                    return 'Ce modèle existe déjà';
                }
                return null;
            }
        });

        if (newModelName) {
            const success = await this.addModel(newModelName);
            if (success) {
                return newModelName.trim();
            }
        }

        return undefined;
    }

    /**
     * Get the current selected model
     * Obtenir le modèle actuellement sélectionné
     */
    getSelectedModel(): string | undefined {
        return this.context.globalState.get<string>('selectedModel');
    }

    /**
     * Set the selected model
     * Définir le modèle sélectionné
     */
    async setSelectedModel(model: string): Promise<void> {
        await this.context.globalState.update('selectedModel', model);
    }
}