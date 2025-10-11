/**
 * Provider Selector Component
 * Composant de démonstration pour le dropdown personnalisé des providers
 *
 * @license AGPL-3.0-only
 */

import React from 'react';
import { ProviderDropdown } from './ProviderDropdown';
import { useProviders } from '../hooks/useProviders';
import './ProviderSelector.css';

export const ProviderSelector: React.FC = () => {
  const {
    providers,
    selectedProvider,
    loading,
    error,
    selectProvider,
    getProvidersWithoutApiKey,
    getAvailableProviders
  } = useProviders();

  if (loading) {
    return (
      <div className="provider-selector">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Chargement des providers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-selector">
        <div className="error-state">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const providersWithoutApiKey = getProvidersWithoutApiKey();
  const availableProviders = getAvailableProviders();

  return (
    <div className="provider-selector">
      <div className="provider-selector-header">
        <h3>🎯 Sélection du Provider IA</h3>
        <p className="provider-selector-subtitle">
          Choisissez un provider avec clé API configurée
        </p>
      </div>

      {/* Dropdown personnalisé */}
      <div className="provider-dropdown-container">
        <ProviderDropdown
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderSelect={selectProvider}
          placeholder="Sélectionner un provider IA..."
        />
      </div>

      {/* Informations sur la sélection */}
      {selectedProvider && (
        <div className="provider-info">
          <h4>Provider sélectionné:</h4>
          <div className="provider-details">
            <div className="detail-row">
              <span className="detail-label">Nom:</span>
              <span className="detail-value">{selectedProvider.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{selectedProvider.description}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Statut:</span>
              <span className={`detail-value status-${selectedProvider.apiKeyConfigured ? 'ready' : 'missing'}`}>
                {selectedProvider.apiKeyConfigured ? '✅ Prêt à utiliser' : '⚠️ Clé API manquante'}
              </span>
            </div>
            {selectedProvider.metadata && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Tokens max:</span>
                  <span className="detail-value">
                    {selectedProvider.metadata.maxContextTokens?.toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Coût:</span>
                  <span className="detail-value">
                    {selectedProvider.metadata.costPerMillionTokens === 0
                      ? 'Gratuit'
                      : `~${selectedProvider.metadata.costPerMillionTokens}$/1M tokens`
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Statistiques et avertissements */}
      <div className="provider-stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{availableProviders.length}</div>
            <div className="stat-label">Providers disponibles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{providersWithoutApiKey.length}</div>
            <div className="stat-label">Sans clé API</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {providers.filter(p => !p.enabled).length}
            </div>
            <div className="stat-label">Désactivés</div>
          </div>
        </div>

        {/* Avertissement pour les providers sans clé */}
        {providersWithoutApiKey.length > 0 && (
          <div className="warning-section">
            <div className="warning-header">
              <span className="warning-icon">⚠️</span>
              <span>Providers nécessitant une configuration</span>
            </div>
            <div className="warning-list">
              {providersWithoutApiKey.map(provider => (
                <div key={provider.id} className="warning-item">
                  <span className="provider-name">{provider.name}</span>
                  <span className="warning-text">- Clé API manquante</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};