/**
 * AI-related type definitions
 * Définitions de types liés à l'IA
 *
 * @license AGPL-3.0-only
 */

/**
 * AI Provider types
 * Types de fournisseurs IA
 */
export type AIProvider = 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'moonshot';

/**
 * AI Routing modes
 * Modes de routage IA
 */
export type AIRoutingMode =
    | 'direct'           // Manual selection
    | 'auto-local'       // Local router
    | 'auto-ollama'      // Ollama delegated routing
    | 'auto-gpt5'        // GPT-5 delegated routing
    | 'auto-claude'      // Claude delegated routing
    | 'auto-deepseek';   // DeepSeek delegated routing

/**
 * Task complexity levels
 * Niveaux de complexité des tâches
 */
export type TaskComplexity = 'low' | 'medium' | 'high';

/**
 * AI Response interface
 * Interface de réponse IA
 */
export interface AIResponse {
    content: string;
    provider: AIProvider;
    tokens: number;
    cost: number;
    latency: number;
    cacheHit: boolean;
    model?: string;
}

/**
 * Streaming callback interface
 * Interface de callback pour le streaming
 */
export interface StreamingCallback {
    onChunk: (chunk: string) => void;
    onComplete: (response: AIResponse) => Promise<void>;
    onError: (error: Error) => void;
}

/**
 * AI Client interface
 * Interface client IA
 */
export interface AIClient {
    execute(prompt: string): Promise<AIResponse>;
    executeWithStreaming(prompt: string, streamingCallback: StreamingCallback): Promise<AIResponse>;
    isAvailable(): Promise<boolean>;
    getProvider(): AIProvider;
}

/**
 * Cache types
 * Types de cache
 */
export interface CacheEntry {
    key: string;
    value: AIResponse;
    timestamp: number;
    ttl: number;
}

/**
 * Analytics request record
 * Enregistrement de requête d'analyse
 */
export interface AnalyticsRequest {
    prompt: string;
    response: string;
    provider: AIProvider;
    routingMode: AIRoutingMode;
    latency: number;
    tokens: number;
    cost: number;
    success: boolean;
    cacheHit: boolean;
    error?: string;
    timestamp?: number;
}

/**
 * Ollama model information
 * Informations sur les modèles Ollama
 */
export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        format: string;
        family: string;
        families?: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

/**
 * Ollama API response
 * Réponse API Ollama
 */
export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}