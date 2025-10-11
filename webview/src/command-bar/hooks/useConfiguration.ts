/**
 * useConfiguration Hook
 * Hook personnalisé pour la gestion persistante de la configuration
 * Sauvegarde et restaure automatiquement les dernières sélections
 *
 * @license AGPL-3.0-only
 */

import { useState, useEffect, useCallback } from 'react';
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

  // Configuration par défaut basée sur les settings
  const defaultConfiguration: Configuration = {
    mode: settings.defaultMode || 'auto',
    provider: settings.defaultEngine || 'deepseek',
    model: '',
    task: settings.defaultTaskType || 'general',
    routingMode: settings.routingMode || 'normal',
  };

  const [configuration, setConfiguration] = useState<Configuration>(defaultConfiguration);

  /**
   * Charger la configuration sauvegardée
   */
  const loadSavedConfiguration = useCallback((): Configuration => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📂 Configuration chargée depuis le stockage local:', parsed);
        return { ...defaultConfiguration, ...parsed };
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement de la configuration:', error);
    }
    return defaultConfiguration;
  }, [defaultConfiguration]);

  /**
   * Sauvegarder la configuration
   */
  const saveConfiguration = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configuration));
      console.log('💾 Configuration sauvegardée:', configuration);
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde de la configuration:', error);
    }
  }, [configuration]);

  /**
   * Mettre à jour la configuration
   */
  const updateConfiguration = useCallback((newConfig: Partial<Configuration>) => {
    setConfiguration(prev => {
      const updated = { ...prev, ...newConfig };

      // Sauvegarder automatiquement après chaque changement
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

  // Charger la configuration sauvegardée au montage
  useEffect(() => {
    const savedConfig = loadSavedConfiguration();
    setConfiguration(savedConfig);
    console.log('🎯 Configuration initiale restaurée:', savedConfig);
  }, [loadSavedConfiguration]);

  // Sauvegarder automatiquement quand la configuration change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveConfiguration();
    }, 500);

    return () => clearTimeout(timer);
  }, [configuration, saveConfiguration]);

  return {
    configuration,
    updateConfiguration,
    saveConfiguration,
  };
};