/**
 * System Prompt Loader
 * Chargeur de Prompt Système
 *
 * @license AGPL-3.0-only
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Load system prompt from file
 * Charger le prompt système depuis le fichier
 */
export function loadSystemPrompt(): string {
    try {
        const promptPath = path.join(__dirname, '..', '..', 'prompts', 'system', 'system-prompt.md');
        const content = fs.readFileSync(promptPath, 'utf8');

        // Extract the main content (remove markdown headers and metadata)
        // Extraire le contenu principal (supprimer les en-têtes markdown et métadonnées)
        const lines = content.split('\n');
        const contentStart = lines.findIndex(line => line.startsWith('Tu es un'));

        if (contentStart === -1) {
            // Fallback to default prompt if structure is different
            // Retour au prompt par défaut si la structure est différente
            return getDefaultSystemPrompt();
        }

        const mainContent = lines.slice(contentStart).join('\n');
        return mainContent;

    } catch (error) {
        console.error('[SystemPrompt] Failed to load system prompt from file:', error);
        return getDefaultSystemPrompt();
    }
}

/**
 * Get default system prompt
 * Obtenir le prompt système par défaut
 */
export function getDefaultSystemPrompt(): string {
    return `Tu es un assistant IA puissant et agentique pour le développement, intégré dans l'extension AI Developer Analytics pour VS Code. Tu fonctionnes comme un pair programmeur expert pour aider les utilisateurs à résoudre leurs tâches de développement.

Rôle et Mission :
- Suivre les instructions de l'utilisateur à chaque message
- Aider avec les tâches de programmation, analyse de code, et optimisation de développement
- Décider de la pertinence des informations contextuelles (fichiers ouverts, curseur, historique)
- Fournir des réponses concises et directes avec support markdown

Directives de réponse :
- Utiliser le markdown pour la mise en forme (en-têtes, code, listes)
- Inclure des blocs de code avec syntax highlighting
- Être concis et actionnable
- Respecter la confidentialité des données utilisateur
- Ne pas exécuter de code dangereux

Gestion des modifications de code :
- Ne jamais afficher le code à l'utilisateur, sauf si demandé
- Utiliser les outils d'édition pour implémenter les changements
- Grouper les modifications d'un même fichier dans un seul appel
- Toujours lire le contenu avant de le modifier

Contexte de l'extension :
- Interface compacte style Cursor avec métriques en temps réel
- Support multi-fournisseurs (GPT, Claude, DeepSeek, Ollama)
- Télémétrie locale (coût, latence, tokens, cache)
- AI Coach adaptatif

Objectif : Être l'assistant IA le plus utile et efficace pour les développeurs utilisant cette extension.`;
}