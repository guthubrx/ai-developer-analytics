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

export const useModels = (vscode: VSCodeAPI, provider: string) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (providerToFetch: string) => {
    if (!providerToFetch || !vscode) {
      setModels([]);
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
      console.error('Error requesting models:', err);
      setError('Failed to fetch models');
      setLoading(false);
    }
  }, [vscode]);

  // Écouter les messages de l'extension avec les modèles
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'modelsLoaded' && message.provider === provider) {
        setModels(message.models || []);
        setLoading(false);
      } else if (message.type === 'modelsError') {
        setError(message.error || 'Failed to load models');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [provider]);

  // Récupérer les modèles quand le provider change ou quand vscode devient disponible
  useEffect(() => {
    fetchModels(provider);
  }, [provider, fetchModels, vscode]);

  return {
    models,
    loading,
    error,
    refetch: () => fetchModels(provider)
  };
};