/**
 * Session Management Types
 * Types pour la gestion des sessions
 *
 * @license AGPL-3.0-only
 */

/**
 * Message exchange in a conversation
 * Échange de message dans une conversation
 */
export interface SessionMessage {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    provider?: string | undefined;
    model?: string | undefined;
    timestamp: number;
    metrics?: MessageMetrics | undefined;
}

/**
 * Detailed metrics for a single message
 * Métriques détaillées pour un message unique
 */
export interface MessageMetrics {
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    cost?: number;
    latency?: number;
    cacheHit?: boolean;
    model?: string;
    provider?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Session-level metrics
 * Métriques au niveau de la session
 */
export interface SessionMetrics {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    cacheHits: number;
    averageLatency: number;
    providerUsage: Record<string, number>; // Provider -> count
    modelUsage: Record<string, number>; // Model -> count
    taskTypeUsage: Record<string, number>; // Task type -> count
    startTime: number;
    lastActivity: number;
    duration: number; // in seconds
}

/**
 * Session configuration
 * Configuration de la session
 */
export interface SessionConfig {
    name: string;
    description?: string | undefined;
    tags?: string[] | undefined;
    defaultProvider?: string | undefined;
    defaultModel?: string | undefined;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
}

/**
 * Complete session data
 * Données complètes de session
 */
export interface Session {
    id: string;
    config: SessionConfig;
    messages: SessionMessage[];
    metrics: SessionMetrics;
    createdAt: number;
    updatedAt: number;
    isActive: boolean;
}

/**
 * Session manager state
 * État du gestionnaire de sessions
 */
export interface SessionManagerState {
    sessions: Session[];
    activeSessionId: string | null;
    sessionOrder: string[]; // Ordered session IDs for tabs
}

/**
 * Session creation options
 * Options de création de session
 */
export interface CreateSessionOptions {
    name: string;
    description?: string;
    tags?: string[];
    copyFromSessionId?: string;
}