/**
 * Provider Storage Module
 * Module de stockage persistant des providers
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Provider information interface
 * Interface d'information du provider
 */
export interface ProviderInfo {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    apiKeyConfigured: boolean;
    lastChecked?: string;
    metadata?: {
        supportsStreaming?: boolean;
        supportsToolCalls?: boolean;
        maxContextTokens?: number;
        costPerMillionTokens?: number;
    };
}

/**
 * Provider storage configuration
 * Configuration du stockage des providers
 */
export interface ProviderStorageConfig {
    version: string;
    lastUpdated: string;
    providers: ProviderInfo[];
    statistics?: {
        totalProviders: number;
        enabledProviders: number;
        configuredProviders: number;
    };
}

/**
 * Provider Storage class
 * Classe de stockage persistant des providers
 */
export class ProviderStorage {
    private storagePath: string;
    private readonly STORAGE_FILE = 'providers.json';
    private readonly VERSION = '1.0.0';

    /**
     * Default providers list
     * Liste des providers par défaut
     */
    private readonly DEFAULT_PROVIDERS: ProviderInfo[] = [
        {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI GPT models (GPT-4, GPT-3.5)',
            enabled: true,
            apiKeyConfigured: false,
            metadata: {
                supportsStreaming: true,
                supportsToolCalls: true,
                maxContextTokens: 128000,
                costPerMillionTokens: 30.0
            }
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Anthropic Claude models (Claude 3.5, Claude 3)',
            enabled: true,
            apiKeyConfigured: false,
            metadata: {
                supportsStreaming: true,
                supportsToolCalls: true,
                maxContextTokens: 200000,
                costPerMillionTokens: 15.0
            }
        },
        {
            id: 'deepseek',
            name: 'DeepSeek',
            description: 'DeepSeek AI models (DeepSeek R1)',
            enabled: true,
            apiKeyConfigured: false,
            metadata: {
                supportsStreaming: true,
                supportsToolCalls: true,
                maxContextTokens: 64000,
                costPerMillionTokens: 0.14
            }
        },
        {
            id: 'moonshot',
            name: 'Moonshot',
            description: 'Moonshot AI (Kimi) models',
            enabled: true,
            apiKeyConfigured: false,
            metadata: {
                supportsStreaming: true,
                supportsToolCalls: false,
                maxContextTokens: 128000,
                costPerMillionTokens: 2.0
            }
        },
        {
            id: 'ollama',
            name: 'Ollama',
            description: 'Local Ollama models',
            enabled: true,
            apiKeyConfigured: true, // No API key required for local
            metadata: {
                supportsStreaming: true,
                supportsToolCalls: true,
                maxContextTokens: 32000,
                costPerMillionTokens: 0.0
            }
        }
    ];

    constructor(context: vscode.ExtensionContext) {
        this.storagePath = context.globalStorageUri.fsPath;
    }

    /**
     * Initialize storage
     * Initialiser le stockage
     */
    async initialize(): Promise<void> {
        try {
            // Ensure storage directory exists
            await fs.mkdir(this.storagePath, { recursive: true });

            // Load or create initial storage
            const exists = await this.storageFileExists();
            if (!exists) {
                await this.saveProviders(this.DEFAULT_PROVIDERS);
                console.log('✅ Provider storage initialized with default providers');
            } else {
                console.log('✅ Provider storage loaded from disk');
            }
        } catch (error) {
            console.error('❌ Failed to initialize provider storage:', error);
            throw error;
        }
    }

    /**
     * Get storage file path
     * Obtenir le chemin du fichier de stockage
     */
    getStorageFilePath(): string {
        return path.join(this.storagePath, this.STORAGE_FILE);
    }

    /**
     * Check if storage file exists
     * Vérifier si le fichier de stockage existe
     */
    private async storageFileExists(): Promise<boolean> {
        try {
            await fs.access(this.getStorageFilePath());
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Load providers from disk
     * Charger les providers depuis le disque
     */
    async loadProviders(): Promise<ProviderInfo[]> {
        try {
            const filePath = this.getStorageFilePath();
            const data = await fs.readFile(filePath, 'utf-8');
            const config: ProviderStorageConfig = JSON.parse(data);

            console.log(`📦 Loaded ${config.providers.length} providers from storage`);
            return config.providers;
        } catch (error) {
            console.warn('⚠️ Failed to load providers, using defaults:', error);
            return this.DEFAULT_PROVIDERS;
        }
    }

    /**
     * Save providers to disk
     * Sauvegarder les providers sur le disque
     */
    async saveProviders(providers: ProviderInfo[]): Promise<void> {
        try {
            const config: ProviderStorageConfig = {
                version: this.VERSION,
                lastUpdated: new Date().toISOString(),
                providers: providers,
                statistics: {
                    totalProviders: providers.length,
                    enabledProviders: providers.filter(p => p.enabled).length,
                    configuredProviders: providers.filter(p => p.apiKeyConfigured).length
                }
            };

            const filePath = this.getStorageFilePath();
            await fs.writeFile(
                filePath,
                JSON.stringify(config, null, 2),
                'utf-8'
            );

            console.log(`💾 Saved ${providers.length} providers to storage`);
        } catch (error) {
            console.error('❌ Failed to save providers:', error);
            throw error;
        }
    }

    /**
     * Get provider by ID
     * Obtenir un provider par son ID
     */
    async getProvider(providerId: string): Promise<ProviderInfo | undefined> {
        const providers = await this.loadProviders();
        return providers.find(p => p.id === providerId);
    }

    /**
     * Update provider information
     * Mettre à jour les informations d'un provider
     */
    async updateProvider(providerId: string, updates: Partial<ProviderInfo>): Promise<boolean> {
        try {
            const providers = await this.loadProviders();
            const index = providers.findIndex(p => p.id === providerId);

            if (index === -1) {
                console.warn(`⚠️ Provider not found: ${providerId}`);
                return false;
            }

            providers[index] = {
                ...providers[index],
                ...updates,
                lastChecked: new Date().toISOString()
            } as ProviderInfo;

            await this.saveProviders(providers);
            console.log(`✅ Updated provider: ${providerId}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update provider ${providerId}:`, error);
            return false;
        }
    }

    /**
     * Get all enabled providers
     * Obtenir tous les providers activés
     */
    async getEnabledProviders(): Promise<ProviderInfo[]> {
        const providers = await this.loadProviders();
        return providers.filter(p => p.enabled);
    }

    /**
     * Get all configured providers
     * Obtenir tous les providers configurés
     */
    async getConfiguredProviders(): Promise<ProviderInfo[]> {
        const providers = await this.loadProviders();
        return providers.filter(p => p.apiKeyConfigured);
    }

    /**
     * Export storage configuration
     * Exporter la configuration de stockage
     */
    async exportConfig(): Promise<ProviderStorageConfig> {
        const providers = await this.loadProviders();
        return {
            version: this.VERSION,
            lastUpdated: new Date().toISOString(),
            providers: providers,
            statistics: {
                totalProviders: providers.length,
                enabledProviders: providers.filter(p => p.enabled).length,
                configuredProviders: providers.filter(p => p.apiKeyConfigured).length
            }
        };
    }

    /**
     * Get storage statistics
     * Obtenir les statistiques de stockage
     */
    async getStatistics(): Promise<{
        totalProviders: number;
        enabledProviders: number;
        configuredProviders: number;
        storageLocation: string;
        lastUpdated?: string | undefined;
    }> {
        const providers = await this.loadProviders();
        const filePath = this.getStorageFilePath();

        let lastUpdated: string | undefined;
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const config: ProviderStorageConfig = JSON.parse(data);
            lastUpdated = config.lastUpdated;
        } catch {
            // Ignore errors
        }

        return {
            totalProviders: providers.length,
            enabledProviders: providers.filter(p => p.enabled).length,
            configuredProviders: providers.filter(p => p.apiKeyConfigured).length,
            storageLocation: filePath,
            lastUpdated: lastUpdated || undefined
        };
    }

    /**
     * Reset to default providers
     * Réinitialiser aux providers par défaut
     */
    async resetToDefaults(): Promise<void> {
        await this.saveProviders(this.DEFAULT_PROVIDERS);
        console.log('✅ Reset providers to defaults');
    }
}
