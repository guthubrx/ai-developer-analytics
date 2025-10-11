/**
 * useConfiguration Hook
 * Hook personnalisé pour la gestion persistante de la configuration
 * Sauvegarde et restaure automatiquement les dernières sélections
 *
 * @license AGPL-3.0-only
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Settings } from '../types';

interface Configuration {
  mode: string;
  provider: string;
  model: string;
  task: string;
  routingMode: string;
}

interface UseConfigurationReturn {
  configuration: Configuration;
  updateConfiguration: (newConfig: Partial<Configuration>) => void;
  saveConfiguration: () => void;
}

/**
 * Hook pour gérer la configuration avec persistance automatique
 */
export const useConfiguration = (settings: Settings): UseConfigurationReturn => {
  // Clé de stockage local
  const STORAGE_KEY = 'ai-analytics-last-configuration';

  // Configuration par défaut basée sur les settings (mémorisée pour éviter les re-créations)
  const defaultConfiguration: Configuration = useMemo(() => ({
    mode: settings.defaultMode || 'auto',
    provider: settings.defaultEngine || 'deepseek',
    model: '',
    task: settings.defaultTaskType || 'general',
    routingMode: settings.routingMode || 'normal',
  }), [settings.defaultMode, settings.defaultEngine, settings.defaultTaskType, settings.routingMode]);

  const [configuration, setConfiguration] = useState<Configuration>(() => {
    // Initialiser directement avec la config sauvegardée si disponible
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultConfiguration, ...parsed };
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement de la configuration:', error);
    }
    return defaultConfiguration;
  });

  /**
   * Sauvegarder la configuration (fonction stable)
   */
  const saveConfiguration = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configuration));
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde de la configuration:', error);
    }
  }, [configuration]);

  /**
   * Mettre à jour la configuration avec sauvegarde automatique
   */
  const updateConfiguration = useCallback((newConfig: Partial<Configuration>) => {
    setConfiguration(prev => {
      const updated = { ...prev, ...newConfig };
      
      // Sauvegarder après un court délai (debounce)
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.warn('⚠️ Erreur lors de la sauvegarde automatique:', error);
        }
      }, 100);

      return updated;
    });
  }, []);

  return {
    configuration,
    updateConfiguration,
    saveConfiguration,
  };
};
