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
    if (!providerToFetch || !vscode) {
      setModels([]);
      return;
    }

    // Vérifier le cache local d'abord
    const cached = modelCache.get(providerToFetch);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setModels(cached.models);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Envoyer un message à l'extension pour récupérer les modèles
      vscode.postMessage({
        type: 'getModels',
        provider: providerToFetch
      });
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

      if (message.type === 'modelsLoaded' && message.provider === provider) {
        const loadedModels = message.models || [];

        setModels(loadedModels);

        // Mettre en cache les modèles
        modelCache.set(provider, {
          models: loadedModels,
          timestamp: Date.now()
        });

        setLoading(false);
      } else if (message.type === 'modelsError') {
        console.error(`❌ Models error for ${provider}:`, message.error);
        setError(message.error || 'Failed to load models');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [provider]);

  // Récupérer les modèles quand le provider change
  useEffect(() => {
    if (provider && vscode) {
      fetchModels(provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  return {
    models,
    loading,
    error,
    refetch: () => fetchModels(provider)
  };
};