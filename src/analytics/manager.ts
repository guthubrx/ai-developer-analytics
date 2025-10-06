/**
 * Analytics Manager with SQLite storage
 * Gestionnaire d'analyses avec stockage SQLite
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import initSqlJs, { Database } from 'sql.js';
import * as CryptoJS from 'crypto-js';
import { AnalyticsRequest } from '../ai/types';

/**
 * Analytics manager for tracking AI usage
 * Gestionnaire d'analyses pour suivre l'utilisation de l'IA
 */
export class AnalyticsManager {
    private db: Database | null = null;
    private readonly dbPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.dbPath = context.globalStorageUri.fsPath + '/analytics.db';
    }

    /**
     * Initialize analytics database
     * Initialiser la base de données d'analyses
     */
    async initialize(): Promise<void> {
        try {
            // Initialize SQL.js
            // Initialiser SQL.js
            const SQL = await initSqlJs();

            // Ensure storage directory exists
            // S'assurer que le répertoire de stockage existe
            const fs = require('fs');
            const path = require('path');
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Try to load existing database or create new one
            // Essayer de charger la base existante ou en créer une nouvelle
            let dbData: Uint8Array | null = null;
            if (fs.existsSync(this.dbPath)) {
                dbData = new Uint8Array(fs.readFileSync(this.dbPath));
            }

            this.db = new SQL.Database(dbData || undefined);

            await this.createTables();
        } catch (error) {
            throw new Error(`Failed to initialize database: ${error}`);
        }
    }

    /**
     * Record AI request in analytics
     * Enregistrer une requête IA dans les analyses
     */
    async recordRequest(request: AnalyticsRequest): Promise<void> {
        if (!this.db) {
            throw new Error('Analytics database not initialized');
        }

        try {
            const timestamp = request.timestamp || Date.now();
            const promptHash = this.hashSensitiveData(request.prompt);
            const responseHash = this.hashSensitiveData(request.response);

            this.db.run(`
                INSERT INTO ai_requests (
                    prompt_hash, response_hash, provider, routing_mode,
                    latency, tokens, cost, success, cache_hit, error, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                promptHash,
                responseHash,
                request.provider,
                request.routingMode,
                request.latency,
                request.tokens,
                request.cost,
                request.success ? 1 : 0,
                request.cacheHit ? 1 : 0,
                request.error || null,
                timestamp
            ]);
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
        if (!this.db) {
            throw new Error('Analytics database not initialized');
        }

        const summary = {
            totalRequests: 0,
            totalCost: 0,
            totalTokens: 0,
            averageLatency: 0,
            successRate: 0,
            cacheHitRate: 0,
            providerDistribution: {} as Record<string, number>,
            routingModeDistribution: {} as Record<string, number>
        };

        try {
            // Get basic statistics
            // Obtenir les statistiques de base
            const basicStats = this.db.exec(`
                SELECT
                    COUNT(*) as totalRequests,
                    SUM(cost) as totalCost,
                    SUM(tokens) as totalTokens,
                    AVG(latency) as averageLatency,
                    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successRate,
                    AVG(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cacheHitRate
                FROM ai_requests
            `);

            if (basicStats.length > 0 && basicStats[0] && basicStats[0].values && basicStats[0].values.length > 0) {
                const row = basicStats[0].values[0];
                summary.totalRequests = row?.[0] as number || 0;
                summary.totalCost = row?.[1] as number || 0;
                summary.totalTokens = row?.[2] as number || 0;
                summary.averageLatency = row?.[3] as number || 0;
                summary.successRate = row?.[4] as number || 0;
                summary.cacheHitRate = row?.[5] as number || 0;
            }

            // Get provider distribution
            // Obtenir la distribution des fournisseurs
            const providerStats = this.db.exec(`
                SELECT provider, COUNT(*) as count
                FROM ai_requests
                GROUP BY provider
            `);

            if (providerStats.length > 0 && providerStats[0]?.values) {
                providerStats[0].values.forEach((row: any[]) => {
                    summary.providerDistribution[row[0] as string] = row[1] as number;
                });
            }

            // Get routing mode distribution
            // Obtenir la distribution des modes de routage
            const routingStats = this.db.exec(`
                SELECT routing_mode, COUNT(*) as count
                FROM ai_requests
                GROUP BY routing_mode
            `);

            if (routingStats.length > 0 && routingStats[0]?.values) {
                routingStats[0].values.forEach((row: any[]) => {
                    summary.routingModeDistribution[row[0] as string] = row[1] as number;
                });
            }
        } catch (error) {
            throw new Error(`Failed to get summary: ${error}`);
        }

        return summary;
    }

    /**
     * Clear all analytics data
     * Effacer toutes les données d'analyses
     */
    async clearData(): Promise<void> {
        if (!this.db) {
            throw new Error('Analytics database not initialized');
        }

        try {
            this.db.run('DELETE FROM ai_requests');
        } catch (error) {
            throw new Error(`Failed to clear data: ${error}`);
        }
    }

    /**
     * Close database connection
     * Fermer la connexion à la base de données
     */
    async close(): Promise<void> {
        if (this.db) {
            // Save database to file before closing
            // Sauvegarder la base de données dans un fichier avant de fermer
            const fs = require('fs');
            const dbData = this.db.export();
            fs.writeFileSync(this.dbPath, dbData);

            this.db.close();
            this.db = null;
        }
    }

    /**
     * Create database tables
     * Créer les tables de la base de données
     */
    private async createTables(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS ai_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prompt_hash TEXT NOT NULL,
                    response_hash TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    routing_mode TEXT NOT NULL,
                    latency INTEGER NOT NULL,
                    tokens INTEGER NOT NULL,
                    cost REAL NOT NULL,
                    success INTEGER NOT NULL,
                    cache_hit INTEGER NOT NULL,
                    error TEXT,
                    timestamp INTEGER NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_provider ON ai_requests(provider);
                CREATE INDEX IF NOT EXISTS idx_routing_mode ON ai_requests(routing_mode);
                CREATE INDEX IF NOT EXISTS idx_timestamp ON ai_requests(timestamp);
            `);
        } catch (error) {
            throw new Error(`Failed to create tables: ${error}`);
        }
    }

    /**
     * Hash sensitive data for privacy
     * Hasher les données sensibles pour la confidentialité
     */
    private hashSensitiveData(data: string): string {
        return CryptoJS.SHA256(data).toString();
    }

}