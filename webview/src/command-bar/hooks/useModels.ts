import { useState, useEffect, useCallback } from 'react';
import type { VSCodeAPI } from '../types';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context?: number;
  maxTokens?: number;
  available: boolean;
}

// Cache local pour les modèles (persiste pendant la session)
const modelCache = new Map<string, { models: ModelInfo[], timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 secondes

export const useModels = (vscode: VSCodeAPI, provider: string) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (providerToFetch: string) => {
    console.log('========== FETCH MODELS HOOK ==========');
    console.log('Provider:', providerToFetch);
    console.log('VSCode API available:', !!vscode);
    console.log('=======================================');

    if (!providerToFetch || !vscode) {
      console.log(`❌ Cannot fetch models: provider=${providerToFetch}, vscode=${!!vscode}`);
      setModels([]);
      return;
    }

    // Vérifier le cache local d'abord
    const cached = modelCache.get(providerToFetch);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`📦 Using cached models for ${providerToFetch}`);
      console.log(`📊 Cached models count: ${cached.models.length}`);
      setModels(cached.models);
      return;
    }

    console.log(`🔍 Fetching models for provider: ${providerToFetch}`);
    console.log(`⏰ Cache expired or not found, fetching from API`);
    setLoading(true);
    setError(null);

    try {
      // Envoyer un message à l'extension pour récupérer les modèles
      console.log(`📤 Sending getModels message for ${providerToFetch}`);
      vscode.postMessage({
        type: 'getModels',
        provider: providerToFetch
      });
      console.log(`📨 Message sent for ${providerToFetch}`);
    } catch (err) {
      console.error('❌ Error requesting models:', err);
      setError('Failed to fetch models');
      setLoading(false);
    }
  }, [vscode]);

  // Écouter les messages de l'extension avec les modèles
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('========== MODELS MESSAGE RECEIVED ==========');
      console.log('Message type:', message.type);
      console.log('Message provider:', message.provider);
      console.log('Current provider:', provider);
      console.log('=============================================');

      if (message.type === 'modelsLoaded' && message.provider === provider) {
        const loadedModels = message.models || [];
        console.log(`✅ Models loaded for ${provider}: ${loadedModels.length} models`);

        if (loadedModels.length > 0) {
          console.log('📋 Loaded models:');
          loadedModels.forEach(model => {
            console.log(`   - ${model.name} (${model.id}) - Available: ${model.available}`);
          });
        }

        setModels(loadedModels);

        // Mettre en cache les modèles
        modelCache.set(provider, {
          models: loadedModels,
          timestamp: Date.now()
        });
        console.log(`💾 Models cached for ${provider}`);

        setLoading(false);
      } else if (message.type === 'modelsError') {
        console.error(`❌ Models error for ${provider}:`, message.error);
        setError(message.error || 'Failed to load models');
        setLoading(false);
      } else {
        console.log(`ℹ️ Ignoring message type: ${message.type} for provider: ${message.provider}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [provider]);

  // Récupérer les modèles quand le provider change ou quand vscode devient disponible
  useEffect(() => {
    console.log('========== MODELS HOOK EFFECT ==========');
    console.log('Provider changed:', provider);
    console.log('VSCode available:', !!vscode);
    console.log('=========================================');
    fetchModels(provider);
  }, [provider, fetchModels, vscode]);

  return {
    models,
    loading,
    error,
    refetch: () => fetchModels(provider)
  };
};