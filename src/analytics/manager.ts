/**
 * Analytics Manager with SQLite storage
 * Gestionnaire d'analyses avec stockage SQLite
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as CryptoJS from 'crypto-js';
import { AnalyticsRequest } from '../ai/types';

/**
 * Analytics manager for tracking AI usage
 * Gestionnaire d'analyses pour suivre l'utilisation de l'IA
 */
export class AnalyticsManager {
    private db: sqlite3.Database | null = null;
    private readonly dbPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.dbPath = context.globalStorageUri.fsPath + '/analytics.db';
    }

    /**
     * Initialize analytics database
     * Initialiser la base de données d'analyses
     */
    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Ensure storage directory exists
            // S'assurer que le répertoire de stockage existe
            const fs = require('fs');
            const path = require('path');
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(new Error(`Failed to open database: ${err.message}`));
                    return;
                }

                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    /**
     * Record AI request in analytics
     * Enregistrer une requête IA dans les analyses
     */
    async recordRequest(request: AnalyticsRequest): Promise<void> {
        if (!this.db) {
            throw new Error('Analytics database not initialized');
        }

        return new Promise((resolve, reject) => {
            const stmt = this.db!.prepare(`
                INSERT INTO ai_requests (
                    prompt_hash, response_hash, provider, routing_mode,
                    latency, tokens, cost, success, cache_hit, error, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const timestamp = request.timestamp || Date.now();
            const promptHash = this.hashSensitiveData(request.prompt);
            const responseHash = this.hashSensitiveData(request.response);

            stmt.run(
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
                timestamp,
                (err: Error | null) => {
                    if (err) {
                        reject(new Error(`Failed to record request: ${err.message}`));
                    } else {
                        resolve();
                    }
                }
            );

            stmt.finalize();
        });
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

        return new Promise((resolve, reject) => {
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

            // Get basic statistics
            // Obtenir les statistiques de base
            this.db!.get(`
                SELECT
                    COUNT(*) as totalRequests,
                    SUM(cost) as totalCost,
                    SUM(tokens) as totalTokens,
                    AVG(latency) as averageLatency,
                    AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successRate,
                    AVG(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cacheHitRate
                FROM ai_requests
            `, (err, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                summary.totalRequests = row.totalRequests || 0;
                summary.totalCost = row.totalCost || 0;
                summary.totalTokens = row.totalTokens || 0;
                summary.averageLatency = row.averageLatency || 0;
                summary.successRate = row.successRate || 0;
                summary.cacheHitRate = row.cacheHitRate || 0;

                // Get provider distribution
                // Obtenir la distribution des fournisseurs
                this.db!.all(`
                    SELECT provider, COUNT(*) as count
                    FROM ai_requests
                    GROUP BY provider
                `, (err, rows: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    rows.forEach(row => {
                        summary.providerDistribution[row.provider] = row.count;
                    });

                    // Get routing mode distribution
                    // Obtenir la distribution des modes de routage
                    this.db!.all(`
                        SELECT routing_mode, COUNT(*) as count
                        FROM ai_requests
                        GROUP BY routing_mode
                    `, (err, rows: any[]) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        rows.forEach(row => {
                            summary.routingModeDistribution[row.routing_mode] = row.count;
                        });

                        resolve(summary);
                    });
                });
            });
        });
    }

    /**
     * Clear all analytics data
     * Effacer toutes les données d'analyses
     */
    async clearData(): Promise<void> {
        if (!this.db) {
            throw new Error('Analytics database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db!.run('DELETE FROM ai_requests', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Close database connection
     * Fermer la connexion à la base de données
     */
    async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    }
                    this.db = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Create database tables
     * Créer les tables de la base de données
     */
    private async createTables(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

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
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Hash sensitive data for privacy
     * Hasher les données sensibles pour la confidentialité
     */
    private hashSensitiveData(data: string): string {
        return CryptoJS.SHA256(data).toString();
    }

}