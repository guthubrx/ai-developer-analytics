/**
 * Session Manager
 * Gestionnaire de sessions
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import {
    Session,
    SessionConfig,
    SessionMessage,
    SessionMetrics,
    SessionManagerState,
    CreateSessionOptions,
    MessageMetrics
} from './types';

export class SessionManager {
    private state: SessionManagerState;
    private context: vscode.ExtensionContext;
    private readonly storageKey = 'sessionManagerState';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.state = this.loadState();

        // Create default session if none exists
        if (this.state.sessions.length === 0) {
            this.createDefaultSession();
        }
    }

    /**
     * Load session manager state from storage
     * Charger l'état du gestionnaire de sessions depuis le stockage
     */
    private loadState(): SessionManagerState {
        const savedState = this.context.globalState.get<SessionManagerState>(this.storageKey);

        if (savedState) {
            return savedState;
        }

        return {
            sessions: [],
            activeSessionId: null,
            sessionOrder: []
        };
    }

    /**
     * Save session manager state to storage
     * Sauvegarder l'état du gestionnaire de sessions dans le stockage
     */
    private async saveState(): Promise<void> {
        await this.context.globalState.update(this.storageKey, this.state);
    }

    /**
     * Create default session
     * Créer une session par défaut
     */
    private createDefaultSession(): void {
        const defaultSession: Session = {
            id: this.generateSessionId(),
            config: {
                name: 'Default Session',
                description: 'Main conversation session'
            },
            messages: [],
            metrics: this.createEmptyMetrics(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
        };

        this.state.sessions.push(defaultSession);
        this.state.activeSessionId = defaultSession.id;
        this.state.sessionOrder.push(defaultSession.id);
        this.saveState();
    }

    /**
     * Generate unique session ID
     * Générer un ID de session unique
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create empty metrics object
     * Créer un objet de métriques vide
     */
    private createEmptyMetrics(): SessionMetrics {
        return {
            totalCost: 0,
            totalTokens: 0,
            totalRequests: 0,
            cacheHits: 0,
            averageLatency: 0,
            providerUsage: {},
            modelUsage: {},
            taskTypeUsage: {},
            startTime: Date.now(),
            lastActivity: Date.now(),
            duration: 0
        };
    }

    /**
     * Get all sessions
     * Obtenir toutes les sessions
     */
    public getSessions(): Session[] {
        return this.state.sessions;
    }

    /**
     * Get active session
     * Obtenir la session active
     */
    public getActiveSession(): Session | null {
        if (!this.state.activeSessionId) {
            return null;
        }
        return this.state.sessions.find(s => s.id === this.state.activeSessionId) || null;
    }

    /**
     * Set active session
     * Définir la session active
     */
    public async setActiveSession(sessionId: string): Promise<void> {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Deactivate previous session
        const previousSession = this.getActiveSession();
        if (previousSession) {
            previousSession.isActive = false;
        }

        // Activate new session
        session.isActive = true;
        this.state.activeSessionId = sessionId;
        await this.saveState();
    }

    /**
     * Create new session
     * Créer une nouvelle session
     */
    public async createSession(options: CreateSessionOptions): Promise<Session> {
        const session: Session = {
            id: this.generateSessionId(),
            config: {
                name: options.name,
                description: options.description,
                tags: options.tags || []
            },
            messages: [],
            metrics: this.createEmptyMetrics(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: false
        };

        // Copy from existing session if specified
        if (options.copyFromSessionId) {
            const sourceSession = this.state.sessions.find(s => s.id === options.copyFromSessionId);
            if (sourceSession) {
                session.messages = [...sourceSession.messages];
                session.metrics = { ...sourceSession.metrics };
            }
        }

        this.state.sessions.push(session);
        this.state.sessionOrder.push(session.id);
        await this.saveState();

        return session;
    }

    /**
     * Delete session
     * Supprimer une session
     */
    public async deleteSession(sessionId: string): Promise<void> {
        const sessionIndex = this.state.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Don't delete if it's the last session
        if (this.state.sessions.length <= 1) {
            throw new Error('Cannot delete the last session');
        }

        // If deleting active session, switch to another
        if (this.state.activeSessionId === sessionId) {
            const otherSession = this.state.sessions.find(s => s.id !== sessionId);
            if (otherSession) {
                this.state.activeSessionId = otherSession.id;
                otherSession.isActive = true;
            }
        }

        this.state.sessions.splice(sessionIndex, 1);

        // Remove from order
        const orderIndex = this.state.sessionOrder.indexOf(sessionId);
        if (orderIndex !== -1) {
            this.state.sessionOrder.splice(orderIndex, 1);
        }

        await this.saveState();
    }

    /**
     * Add message to active session
     * Ajouter un message à la session active
     */
    public async addMessage(message: Omit<SessionMessage, 'id' | 'timestamp'>, metrics?: MessageMetrics): Promise<void> {
        const session = this.getActiveSession();
        if (!session) {
            throw new Error('No active session');
        }

        const fullMessage: SessionMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...message,
            metrics
        };

        session.messages.push(fullMessage);
        session.updatedAt = Date.now();

        // Update session metrics
        await this.updateSessionMetrics(session, fullMessage, metrics);
        await this.saveState();
    }

    /**
     * Update session metrics based on new message
     * Mettre à jour les métriques de session basées sur un nouveau message
     */
    private async updateSessionMetrics(session: Session, message: SessionMessage, metrics?: MessageMetrics): Promise<void> {
        if (!metrics) return;

        // Update basic metrics
        if (metrics.cost) {
            session.metrics.totalCost += metrics.cost;
        }
        if (metrics.tokens) {
            session.metrics.totalTokens += metrics.tokens.total;
        }
        if (metrics.latency) {
            session.metrics.totalRequests++;
            // Update average latency
            const totalLatency = session.metrics.averageLatency * (session.metrics.totalRequests - 1) + metrics.latency;
            session.metrics.averageLatency = totalLatency / session.metrics.totalRequests;
        }
        if (metrics.cacheHit) {
            session.metrics.cacheHits++;
        }

        // Update provider usage
        if (metrics.provider) {
            session.metrics.providerUsage[metrics.provider] =
                (session.metrics.providerUsage[metrics.provider] || 0) + 1;
        }

        // Update model usage
        if (metrics.model) {
            session.metrics.modelUsage[metrics.model] =
                (session.metrics.modelUsage[metrics.model] || 0) + 1;
        }

        // Update task type usage (if available)
        if (message.type === 'user') {
            // This would need to be enhanced based on actual task detection
            const taskType = 'general'; // Default task type
            session.metrics.taskTypeUsage[taskType] =
                (session.metrics.taskTypeUsage[taskType] || 0) + 1;
        }

        // Update duration
        session.metrics.lastActivity = Date.now();
        session.metrics.duration = Math.floor((session.metrics.lastActivity - session.metrics.startTime) / 1000);
    }

    /**
     * Reorder sessions
     * Réorganiser les sessions
     */
    public async reorderSessions(newOrder: string[]): Promise<void> {
        // Validate that all session IDs exist and no duplicates
        const validSessionIds = new Set(this.state.sessions.map(s => s.id));
        const newOrderSet = new Set(newOrder);

        if (newOrder.length !== newOrderSet.size) {
            throw new Error('Duplicate session IDs in new order');
        }

        if (newOrder.length !== validSessionIds.size) {
            throw new Error('New order must include all session IDs');
        }

        for (const sessionId of newOrder) {
            if (!validSessionIds.has(sessionId)) {
                throw new Error(`Invalid session ID: ${sessionId}`);
            }
        }

        this.state.sessionOrder = newOrder;
        await this.saveState();
    }

    /**
     * Update session configuration
     * Mettre à jour la configuration de session
     */
    public async updateSessionConfig(sessionId: string, config: Partial<SessionConfig>): Promise<void> {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.config = { ...session.config, ...config };
        session.updatedAt = Date.now();
        await this.saveState();
    }

    /**
     * Clear session messages
     * Effacer les messages d'une session
     */
    public async clearSession(sessionId: string): Promise<void> {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.messages = [];
        session.metrics = this.createEmptyMetrics();
        session.updatedAt = Date.now();
        await this.saveState();
    }

    /**
     * Export session data
     * Exporter les données de session
     */
    public exportSession(sessionId: string): Session {
        const session = this.state.sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        return { ...session };
    }

    /**
     * Import session data
     * Importer des données de session
     */
    public async importSession(sessionData: Session): Promise<void> {
        // Ensure unique ID
        const existingSession = this.state.sessions.find(s => s.id === sessionData.id);
        if (existingSession) {
            sessionData.id = this.generateSessionId();
        }

        this.state.sessions.push(sessionData);
        this.state.sessionOrder.push(sessionData.id);
        await this.saveState();
    }
}