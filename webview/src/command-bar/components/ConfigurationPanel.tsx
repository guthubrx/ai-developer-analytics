import React, { useEffect } from 'react';
import { useModels } from '../hooks/useModels';
import { useProviders } from '../hooks/useProviders';
import type { Settings, VSCodeAPI } from '../types';

interface ConfigurationPanelProps {
  configuration: {
    mode: string;
    provider: string;
    model: string;
    task: string;
    routingMode: string;
  };
  settings: Settings;
  onChange: (config: Partial<typeof configuration>) => void;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  vscode: VSCodeAPI;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  settings,
  onChange,
  onUpdateSettings,
  vscode,
}) => {
  const isManualMode = configuration.mode === 'manual';
  const { models, loading, error } = useModels(vscode, configuration.provider);
  const { providers, loading: providersLoading } = useProviders(vscode);

  // Charger les modèles quand le provider change
  useEffect(() => {
    if (configuration.provider) {
      console.log(`🔄 Provider changed to: ${configuration.provider}`);
    }
  }, [configuration.provider]);

  // Helper pour obtenir le statut du provider
  const getProviderStatus = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return '';
    if (!provider.enabled) return ' [Désactivé]';
    if (!provider.apiKeyConfigured) return ' [Clé API manquante]';
    return '';
  };

  // Helper pour vérifier si un provider est sélectionnable
  const isProviderSelectable = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider && provider.enabled && provider.apiKeyConfigured;
  };

  // Helper pour obtenir le statut du modèle
  const getModelStatus = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return '';
    if (!model.available) return ' [Non disponible]';
    return '';
  };

  return (
    <div className="configuration-panel">
      <div className="config-row">
        <div className="dropdown-wrapper">
          <span className="dropdown-icon">⚙</span>
          <select
            value={configuration.mode}
            onChange={(e) => onChange({ mode: e.target.value })}
            style={{ fontSize: `${settings.dropdownFontSize}px` }}
          >
            <option value="manual">Manual Mode</option>
            <option value="auto">Auto Mode</option>
          </select>
        </div>

        {isManualMode ? (
          <>
            <div className="dropdown-wrapper">
              <span className="dropdown-icon">◉</span>
              <select
                value={configuration.provider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  onChange({ 
                    provider: newProvider,
                    model: '' // Reset le modèle quand on change de provider
                  });
                }}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
                disabled={providersLoading}
                className={!configuration.provider ? 'placeholder' : ''}
              >
                <option value="" disabled>
                  {providersLoading ? 'Chargement...' : 'Sélectionner un provider'}
                </option>
                {providers.map((provider) => (
                  <option 
                    key={provider.id} 
                    value={provider.id}
                    disabled={!isProviderSelectable(provider.id)}
                    className={
                      !provider.enabled ? 'disabled-option' :
                      !provider.apiKeyConfigured ? 'warning-option' : 
                      ''
                    }
                  >
                    {provider.name}{getProviderStatus(provider.id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="dropdown-wrapper">
              <span className="dropdown-icon">🧠</span>
              <select
                value={configuration.model}
                onChange={(e) => onChange({ model: e.target.value })}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
                disabled={loading || !configuration.provider}
                className={!configuration.model ? 'placeholder' : ''}
              >
                <option value="" disabled>
                  {loading ? 'Chargement des modèles...' : 
                   !configuration.provider ? 'Sélectionnez d\'abord un provider' :
                   'Sélectionner un modèle'}
                </option>
                {models.map((model) => (
                  <option 
                    key={model.id} 
                    value={model.id}
                    disabled={!model.available}
                    className={!model.available ? 'disabled-option' : ''}
                  >
                    {model.name}{getModelStatus(model.id)}
                  </option>
                ))}
              </select>
              {error && (
                <span className="error-icon" title={error} style={{ filter: 'grayscale(100%)', opacity: 0.7 }}>⚠️</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="dropdown-wrapper">
              <span className="dropdown-icon">◯</span>
              <select
                value={configuration.task}
                onChange={(e) => onChange({ task: e.target.value })}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
              >
                <option value="general">General</option>
                <option value="code">Code</option>
                <option value="documentation">Documentation</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="dropdown-wrapper">
              <span className="dropdown-icon">◐</span>
              <select
                value={configuration.routingMode}
                onChange={(e) => onChange({ routingMode: e.target.value })}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
              >
                <option value="eco">Eco</option>
                <option value="normal">Normal</option>
                <option value="quality">Quality</option>
                <option value="strict-json">Strict JSON</option>
                <option value="creative">Creative</option>
              </select>
            </div>
          </>
        )}

        <button
          className="settings-button"
          onClick={() => onUpdateSettings({})}
          title="Open Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};