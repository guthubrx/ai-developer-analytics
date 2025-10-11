/**
 * Provider API Configuration
 * Configuration centralisée des URLs des APIs des fournisseurs
 *
 * @license AGPL-3.0-only
 */

/**
 * Configuration des endpoints API pour chaque provider
 */
export interface ProviderApiConfig {
    /** Base URL de l'API */
    baseUrl: string;
    /** Endpoint pour les requêtes de chat/completions */
    chatEndpoint: string;
    /** Endpoint pour lister les modèles disponibles */
    modelsEndpoint: string;
    /** Version de l'API (si applicable) */
    apiVersion?: string;
    /** En-têtes spécifiques au provider */
    headers?: {
        authHeader: string; // Nom de l'en-tête d'authentification
        versionHeader?: string; // Nom de l'en-tête de version (optionnel)
    };
}

/**
 * Configuration centralisée des APIs des providers
 *
 * IMPORTANT: Cette configuration garantit que les URLs sont cohérentes
 * entre les clients (chat) et le vérificateur de modèles.
 */
export const PROVIDER_API_CONFIG: Record<string, ProviderApiConfig> = {
    anthropic: {
        baseUrl: 'https://api.anthropic.com',
        chatEndpoint: '/v1/messages',
        modelsEndpoint: '/v1/models',
        apiVersion: '2023-06-01',
        headers: {
            authHeader: 'x-api-key',
            versionHeader: 'anthropic-version'
        }
    },

    deepseek: {
        baseUrl: 'https://api.deepseek.com',
        chatEndpoint: '/v1/chat/completions',
        modelsEndpoint: '/v1/models',
        headers: {
            authHeader: 'Authorization' // Format: Bearer {token}
        }
    },

    moonshot: {
        baseUrl: 'https://api.moonshot.ai',
        chatEndpoint: '/v1/chat/completions',
        modelsEndpoint: '/v1/models',
        headers: {
            authHeader: 'Authorization' // Format: Bearer {token}
        }
    },

    openai: {
        baseUrl: 'https://api.openai.com',
        chatEndpoint: '/v1/chat/completions',
        modelsEndpoint: '/v1/models',
        headers: {
            authHeader: 'Authorization' // Format: Bearer {token}
        }
    }
};

/**
 * Obtenir l'URL complète pour les requêtes de chat
 */
export function getChatUrl(provider: string): string {
    const config = PROVIDER_API_CONFIG[provider.toLowerCase()];
    if (!config) {
        throw new Error(`Provider ${provider} not configured`);
    }
    return `${config.baseUrl}${config.chatEndpoint}`;
}

/**
 * Obtenir l'URL complète pour lister les modèles
 */
export function getModelsUrl(provider: string): string {
    const config = PROVIDER_API_CONFIG[provider.toLowerCase()];
    if (!config) {
        throw new Error(`Provider ${provider} not configured`);
    }
    return `${config.baseUrl}${config.modelsEndpoint}`;
}

/**
 * Obtenir la configuration complète d'un provider
 */
export function getProviderConfig(provider: string): ProviderApiConfig {
    const config = PROVIDER_API_CONFIG[provider.toLowerCase()];
    if (!config) {
        throw new Error(`Provider ${provider} not configured`);
    }
    // S'assurer que les headers existent toujours
    if (!config.headers) {
        config.headers = {
            authHeader: 'Authorization' // Valeur par défaut
        };
    }
    return config;
}

/**
 * Vérifier si un provider est configuré
 */
export function isProviderConfigured(provider: string): boolean {
    return provider.toLowerCase() in PROVIDER_API_CONFIG;
}
