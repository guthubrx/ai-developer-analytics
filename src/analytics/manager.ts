/**
 * Analytics Manager with JSON storage
 * Gestionnaire d'analyses avec stockage JSON
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AnalyticsRequest } from '../ai/types';

interface AnalyticsData {
    requests: Array<{
        prompt_hash: string;
        response_hash: string;
        provider: string;
        routing_mode: string;
        latency: number;
        tokens: number;
        cost: number;
        success: number;
        cache_hit: number;
        error?: string;
        timestamp: number;
    }>;
}

/**
 * Analytics manager for tracking AI usage
 * Gestionnaire d'analyses pour suivre l'utilisation de l'IA
 */
export class AnalyticsManager {
    private dataPath: string;
    private data: AnalyticsData = { requests: [] };

    constructor(context: vscode.ExtensionContext) {
        this.dataPath = context.globalStorageUri.fsPath + '/analytics.json';
    }

    /**
     * Initialize analytics data
     * Initialiser les données d'analyses
     */
    async initialize(): Promise<void> {
        try {
            // Ensure storage directory exists
            // S'assurer que le répertoire de stockage existe
            const dir = path.dirname(this.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Try to load existing data or create new
            // Essayer de charger les données existantes ou en créer de nouvelles
            if (fs.existsSync(this.dataPath)) {
                const fileData = fs.readFileSync(this.dataPath, 'utf8');
                this.data = JSON.parse(fileData);
            } else {
                this.data = { requests: [] };
                await this.saveData();
            }
        } catch (error) {
            console.error(`Failed to initialize analytics: ${error}`);
            // Don't throw - allow extension to continue even if analytics fails
            this.data = { requests: [] };
        }
    }

    /**
     * Record AI request in analytics
     * Enregistrer une requête IA dans les analyses
     */
    async recordRequest(request: AnalyticsRequest): Promise<void> {
        try {
            const timestamp = request.timestamp || Date.now();
            const promptHash = this.hashSensitiveData(request.prompt);
            const responseHash = this.hashSensitiveData(request.response);

            this.data.requests.push({
                prompt_hash: promptHash,
                response_hash: responseHash,
                provider: request.provider,
                routing_mode: request.routingMode,
                latency: request.latency,
                tokens: request.tokens,
                cost: request.cost,
                success: request.success ? 1 : 0,
                cache_hit: request.cacheHit ? 1 : 0,
                error: request.error || undefined,
                timestamp
            });

            // Keep only last 1000 requests to prevent file from growing too large
            // Conserver seulement les 1000 dernières requêtes pour éviter que le fichier ne devienne trop volumineux
            if (this.data.requests.length > 1000) {
                this.data.requests = this.data.requests.slice(-1000);
            }

            await this.saveData();
        } catch (error) {
            throw new Error(`Failed to record request: ${error}`);
        }
    }

    /**
     * Get analytics summary
     * Obtenir un résumé des analyses
     */
    async getSummary(): Promise<{
        totalRequests: number;
        totalCost: number;
        totalTokens: number;
        averageLatency: number;
        successRate: number;
        cacheHitRate: number;
        providerDistribution: Record<string, number>;
        routingModeDistribution: Record<string, number>;
    }> {
        const requests = this.data.requests;
        const totalRequests = requests.length;

        if (totalRequests === 0) {
            return {
                totalRequests: 0,
                totalCost: 0,
                totalTokens: 0,
                averageLatency: 0,
                successRate: 0,
                cacheHitRate: 0,
                providerDistribution: {},
                routingModeDistribution: {}
            };
        }

        const totalCost = requests.reduce((sum, req) => sum + req.cost, 0);
        const totalTokens = requests.reduce((sum, req) => sum + req.tokens, 0);
        const averageLatency = requests.reduce((sum, req) => sum + req.latency, 0) / totalRequests;
        const successRate = requests.filter(req => req.success === 1).length / totalRequests;
        const cacheHitRate = requests.filter(req => req.cache_hit === 1).length / totalRequests;

        const providerDistribution: Record<string, number> = {};
        const routingModeDistribution: Record<string, number> = {};

        requests.forEach(req => {
            providerDistribution[req.provider] = (providerDistribution[req.provider] || 0) + 1;
            routingModeDistribution[req.routing_mode] = (routingModeDistribution[req.routing_mode] || 0) + 1;
        });

        return {
            totalRequests,
            totalCost,
            totalTokens,
            averageLatency,
            successRate,
            cacheHitRate,
            providerDistribution,
            routingModeDistribution
        };
    }

    /**
     * Clear all analytics data
     * Effacer toutes les données d'analyses
     */
    async clearData(): Promise<void> {
        try {
            this.data.requests = [];
            await this.saveData();
        } catch (error) {
            throw new Error(`Failed to clear data: ${error}`);
        }
    }

    /**
     * Close analytics manager
     * Fermer le gestionnaire d'analyses
     */
    async close(): Promise<void> {
        // Nothing to close for JSON storage
        // Rien à fermer pour le stockage JSON
    }

    /**
     * Save data to file
     * Sauvegarder les données dans un fichier
     */
    private async saveData(): Promise<void> {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error(`Failed to save analytics data: ${error}`);
            // Don't throw - allow operation to continue
        }
    }

    /**
     * Hash sensitive data for privacy
     * Hasher les données sensibles pour la confidentialité
     */
    private hashSensitiveData(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}