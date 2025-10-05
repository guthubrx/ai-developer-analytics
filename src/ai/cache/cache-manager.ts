/**
 * AI Cache Manager with exact, semantic, and LRU caching
 * Gestionnaire de cache IA avec cache exact, sémantique et LRU
 *
 * @license AGPL-3.0-only
 */

import { LRUCache } from 'lru-cache';
import { CacheEntry, AIResponse } from '../types';

/**
 * Cache manager for AI responses
 * Gestionnaire de cache pour les réponses IA
 */
export class CacheManager {
    private readonly exactCache: LRUCache<string, CacheEntry>;
    private readonly semanticCache: LRUCache<string, CacheEntry>;
    private readonly maxCacheSize: number = 1000;

    constructor() {
        this.exactCache = new LRUCache<string, CacheEntry>({
            max: this.maxCacheSize,
            ttl: 1000 * 60 * 60 * 24, // 24 hours
            updateAgeOnGet: true
        });

        this.semanticCache = new LRUCache<string, CacheEntry>({
            max: this.maxCacheSize,
            ttl: 1000 * 60 * 60 * 24, // 24 hours
            updateAgeOnGet: true
        });
    }

    /**
     * Get cached response for exact prompt match
     * Obtenir la réponse en cache pour une correspondance exacte de prompt
     */
    getExact(prompt: string): AIResponse | null {
        const key = this.generateExactKey(prompt);
        const entry = this.exactCache.get(key);

        if (entry && !this.isExpired(entry)) {
            return entry.value;
        }

        return null;
    }

    /**
     * Get cached response for semantically similar prompt
     * Obtenir la réponse en cache pour un prompt sémantiquement similaire
     */
    getSemantic(prompt: string): AIResponse | null {
        const key = this.generateSemanticKey(prompt);
        const entry = this.semanticCache.get(key);

        if (entry && !this.isExpired(entry)) {
            return entry.value;
        }

        return null;
    }

    /**
     * Set cache entry for exact prompt
     * Définir l'entrée de cache pour un prompt exact
     */
    setExact(prompt: string, response: AIResponse, ttl: number = 1000 * 60 * 60 * 24): void {
        const key = this.generateExactKey(prompt);
        const entry: CacheEntry = {
            key,
            value: response,
            timestamp: Date.now(),
            ttl
        };

        this.exactCache.set(key, entry);
    }

    /**
     * Set cache entry for semantically similar prompt
     * Définir l'entrée de cache pour un prompt sémantiquement similaire
     */
    setSemantic(prompt: string, response: AIResponse, ttl: number = 1000 * 60 * 60 * 24): void {
        const key = this.generateSemanticKey(prompt);
        const entry: CacheEntry = {
            key,
            value: response,
            timestamp: Date.now(),
            ttl
        };

        this.semanticCache.set(key, entry);
    }

    /**
     * Clear all caches
     * Vider tous les caches
     */
    clear(): void {
        this.exactCache.clear();
        this.semanticCache.clear();
    }

    /**
     * Get cache statistics
     * Obtenir les statistiques du cache
     */
    getStats(): {
        exactSize: number;
        semanticSize: number;
        exactHitRate: number;
        semanticHitRate: number;
    } {
        return {
            exactSize: this.exactCache.size,
            semanticSize: this.semanticCache.size,
            exactHitRate: this.calculateHitRate(this.exactCache),
            semanticHitRate: this.calculateHitRate(this.semanticCache)
        };
    }

    /**
     * Generate exact cache key
     * Générer une clé de cache exacte
     */
    private generateExactKey(prompt: string): string {
        // Simple hash for exact matching
        // Hash simple pour la correspondance exacte
        return Buffer.from(prompt).toString('base64');
    }

    /**
     * Generate semantic cache key
     * Générer une clé de cache sémantique
     */
    private generateSemanticKey(prompt: string): string {
        // Simplified semantic key generation
        // In a real implementation, you would use embeddings
        // Génération de clé sémantique simplifiée
        // Dans une implémentation réelle, vous utiliseriez des embeddings

        // Normalize text: lowercase, remove extra spaces, basic stemming
        // Normaliser le texte : minuscules, supprimer les espaces supplémentaires, stemming basique
        const normalized = prompt
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/ing\b/g, '') // Basic stemming
            .replace(/ed\b/g, '')
            .replace(/s\b/g, '');

        // Take first 100 characters as key
        // Prendre les 100 premiers caractères comme clé
        return normalized.substring(0, 100);
    }

    /**
     * Check if cache entry is expired
     * Vérifier si une entrée de cache est expirée
     */
    private isExpired(entry: CacheEntry): boolean {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    /**
     * Calculate cache hit rate
     * Calculer le taux de réussite du cache
     */
    private calculateHitRate(cache: LRUCache<string, CacheEntry>): number {
        // This is a simplified implementation
        // In a real implementation, you would track hits and misses
        // Ceci est une implémentation simplifiée
        // Dans une implémentation réelle, vous suivriez les hits et les misses
        return cache.size > 0 ? 0.3 : 0; // Placeholder value
    }
}