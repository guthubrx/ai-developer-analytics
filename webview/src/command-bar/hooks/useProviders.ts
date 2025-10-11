/**
 * useProviders Hook
 * Hook personnalisé pour la gestion des providers avec détection des clés API
 *
 * @license AGPL-3.0-only
 */

import { useState, useEffect, useCallback } from 'react';
import { ProviderInfo, VSCodeAPI } from '../types';

// Cache local pour les providers (persiste pendant la session)
const providersCache = new Map<string, { providers: ProviderInfo[], timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 secondes

interface UseProvidersReturn {
  providers: ProviderInfo[];
  selectedProvider: ProviderInfo | null;
  loading: boolean;
  error: string | null;
  selectProvider: (provider: ProviderInfo) => void;
  refreshProviders: () => Promise<void>;
  getProvidersWithoutApiKey: () => ProviderInfo[];
  getAvailableProviders: () => ProviderInfo[];
}


/**
 * Hook pour gérer les providers avec détection des clés API
 */
export const useProviders = (vscode?: VSCodeAPI): UseProvidersReturn => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les providers depuis VSCode
   */
  const loadProviders = useCallback(async (): Promise<void> => {
    console.log('========== LOAD PROVIDERS HOOK ==========');
    console.log('VSCode API available:', !!vscode);
    console.log('==========================================');

    if (!vscode) {
      console.log('❌ VSCode API not available, using mock data');
      // Mode développement - données mock
      const mockProviders: ProviderInfo[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'OpenAI GPT models (GPT-4, GPT-3.5)',
          enabled: true,
          apiKeyConfigured: true,
          metadata: {
            supportsStreaming: true,
            supportsToolCalls: true,
            maxContextTokens: 128000,
            costPerMillionTokens: 30.0
          }
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          description: 'Anthropic Claude models (Claude 3.5, Claude 3)',
          enabled: true,
          apiKeyConfigured: false,
          metadata: {
            supportsStreaming: true,
            supportsToolCalls: true,
            maxContextTokens: 200000,
            costPerMillionTokens: 15.0
          }
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          description: 'DeepSeek AI models (DeepSeek R1)',
          enabled: true,
          apiKeyConfigured: false,
          metadata: {
            supportsStreaming: true,
            supportsToolCalls: true,
            maxContextTokens: 64000,
            costPerMillionTokens: 0.14
          }
        },
        {
          id: 'moonshot',
          name: 'Moonshot',
          description: 'Moonshot AI (Kimi) models',
          enabled: false,
          apiKeyConfigured: false,
          metadata: {
            supportsStreaming: true,
            supportsToolCalls: false,
            maxContextTokens: 128000,
            costPerMillionTokens: 2.0
          }
        },
        {
          id: 'ollama',
          name: 'Ollama',
          description: 'Local Ollama models',
          enabled: true,
          apiKeyConfigured: true,
          metadata: {
            supportsStreaming: true,
            supportsToolCalls: true,
            maxContextTokens: 32000,
            costPerMillionTokens: 0.0
          }
        }
      ];

      setProviders(mockProviders);

      // Sélectionner automatiquement le premier provider avec clé API
      const firstAvailableProvider = mockProviders.find(p =>
        p.enabled && p.apiKeyConfigured
      );

      if (firstAvailableProvider) {
        setSelectedProvider(firstAvailableProvider);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache local d'abord
      const cached = providersCache.get('providers');
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Using cached providers`);
        console.log(`📊 Cached providers count: ${cached.providers.length}`);
        setProviders(cached.providers);

        // Sélectionner automatiquement le premier provider avec clé API
        const firstAvailableProvider = cached.providers.find(p =>
          p.enabled && p.apiKeyConfigured
        );

        if (firstAvailableProvider) {
          setSelectedProvider(firstAvailableProvider);
        }
        setLoading(false);
        return;
      }

      console.log(`🔍 Fetching providers from VSCode`);
      console.log(`⏰ Cache expired or not found, fetching from API`);

      // Envoyer un message à l'extension pour récupérer les providers
      console.log(`📤 Sending getProvidersStatus message`);
      vscode.postMessage({ type: 'getProvidersStatus' });
      console.log(`📨 Message sent`);

    } catch (err) {
      console.error('❌ Error requesting providers:', err);
      setError('Failed to fetch providers');
      setLoading(false);
    }
  }, [vscode]);

  /**
   * Sélectionner un provider
   */
  const selectProvider = useCallback((provider: ProviderInfo): void => {
    // Vérifier que le provider est activé et a une clé API
    if (!provider.enabled) {
      console.warn(`⚠️ Provider ${provider.name} is disabled`);
      return;
    }

    if (!provider.apiKeyConfigured) {
      console.warn(`⚠️ Provider ${provider.name} has no API key configured`);
      return;
    }

    setSelectedProvider(provider);
    console.log(`✅ Selected provider: ${provider.name}`);
  }, []);

  /**
   * Rafraîchir la liste des providers
   */
  const refreshProviders = useCallback(async (): Promise<void> => {
    await loadProviders();
  }, [loadProviders]);

  /**
   * Obtenir les providers sans clé API
   */
  const getProvidersWithoutApiKey = useCallback((): ProviderInfo[] => {
    return providers.filter(provider =>
      provider.enabled && !provider.apiKeyConfigured
    );
  }, [providers]);

  /**
   * Obtenir les providers disponibles (activés avec clé API)
   */
  const getAvailableProviders = useCallback((): ProviderInfo[] => {
    return providers.filter(provider =>
      provider.enabled && provider.apiKeyConfigured
    );
  }, [providers]);

  // Écouter les messages de l'extension avec les providers
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('========== PROVIDERS MESSAGE RECEIVED ==========');
      console.log('Message type:', message.type);
      console.log('=================================================');

      if (message.type === 'providersStatus') {
        const loadedProviders = message.providers || [];
        console.log(`✅ Providers loaded: ${loadedProviders.length} providers`);

        if (loadedProviders.length > 0) {
          console.log('📋 Loaded providers:');
          loadedProviders.forEach(provider => {
            console.log(`   - ${provider.name} (${provider.id}) - Enabled: ${provider.enabled}, API Key: ${provider.apiKeyConfigured}`);
          });
        }

        setProviders(loadedProviders);

        // Mettre en cache les providers
        providersCache.set('providers', {
          providers: loadedProviders,
          timestamp: Date.now()
        });
        console.log(`💾 Providers cached`);

        // Sélectionner automatiquement le premier provider avec clé API
        const firstAvailableProvider = loadedProviders.find(p =>
          p.enabled && p.apiKeyConfigured
        );

        if (firstAvailableProvider) {
          console.log(`🎯 Auto-selected provider: ${firstAvailableProvider.name}`);
          setSelectedProvider(firstAvailableProvider);
        }

        setLoading(false);
      } else if (message.type === 'providersError') {
        console.error(`❌ Providers error:`, message.error);
        setError(message.error || 'Failed to load providers');
        setLoading(false);
      } else {
        console.log(`ℹ️ Ignoring message type: ${message.type}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Charger les providers au montage
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers,
    selectedProvider,
    loading,
    error,
    selectProvider,
    refreshProviders,
    getProvidersWithoutApiKey,
    getAvailableProviders
  };
};