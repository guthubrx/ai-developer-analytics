/**
 * Provider Dropdown Component
 * Composant dropdown personnalisé pour les providers avec gestion des clés API
 *
 * @license AGPL-3.0-only
 */

import React, { useState, useRef, useEffect } from 'react';
import { ProviderInfo } from '../../types';
import './ProviderDropdown.css';

interface ProviderDropdownProps {
  providers: ProviderInfo[];
  selectedProvider: ProviderInfo | null;
  onProviderSelect: (provider: ProviderInfo) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ProviderDropdown: React.FC<ProviderDropdownProps> = ({
  providers,
  selectedProvider,
  onProviderSelect,
  placeholder = "Sélectionner un provider...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrer les providers selon la recherche
  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProviderSelect = (provider: ProviderInfo) => {
    // Ne pas permettre la sélection si le provider n'a pas de clé API
    if (!provider.apiKeyConfigured) {
      return;
    }

    onProviderSelect(provider);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const getProviderStatusIcon = (provider: ProviderInfo) => {
    if (!provider.enabled) {
      return '❌';
    }
    return provider.apiKeyConfigured ? '✓' : '⚠️';
  };

  const getProviderStatusText = (provider: ProviderInfo) => {
    if (!provider.enabled) {
      return 'Désactivé';
    }
    return provider.apiKeyConfigured ? 'Prêt à utiliser' : 'Clé API manquante';
  };

  return (
    <div className="provider-dropdown" ref={dropdownRef}>
      {/* Bouton de déclenchement */}
      <button
        type="button"
        className={`provider-dropdown-trigger ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        <div className="provider-dropdown-selected">
          {selectedProvider ? (
            <>
              <span className={`provider-icon ${selectedProvider.apiKeyConfigured ? 'success' : ''}`}>
                {getProviderStatusIcon(selectedProvider)}
              </span>
              <span className="provider-name">
                {selectedProvider.name}
              </span>
            </>
          ) : (
            <span className="provider-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="provider-dropdown-menu">
          {/* Barre de recherche */}
          <div className="provider-search">
            <input
              type="text"
              placeholder="Rechercher un provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="provider-search-input"
              autoFocus
            />
          </div>

          {/* Liste des providers */}
          <div className="provider-list">
            {filteredProviders.length === 0 ? (
              <div className="provider-item no-results">
                Aucun provider trouvé
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`provider-item ${
                    !provider.apiKeyConfigured ? 'no-api-key' : ''
                  } ${
                    !provider.enabled ? 'disabled' : ''
                  } ${
                    selectedProvider?.id === provider.id ? 'selected' : ''
                  }`}
                  onClick={() => handleProviderSelect(provider)}
                >
                  <div className="provider-item-content">
                    <div className="provider-item-header">
                      <span className="provider-icon">
                        {getProviderStatusIcon(provider)}
                      </span>
                      <span className="provider-name">
                        {provider.name}
                      </span>
                    </div>

                    <div className="provider-item-details">
                      <span className="provider-description">
                        {provider.description}
                      </span>
                      <span className="provider-status">
                        {getProviderStatusText(provider)}
                      </span>
                    </div>

                    {/* Informations supplémentaires pour les providers sans clé */}
                    {!provider.apiKeyConfigured && (
                      <div className="provider-warning">
                        ⚠️ Clé API requise - Configurez dans les paramètres
                      </div>
                    )}

                    {/* Informations de coût */}
                    {provider.metadata?.costPerMillionTokens !== undefined && (
                      <div className="provider-cost">
                        💰 ~{provider.metadata.costPerMillionTokens}$/1M tokens
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Statistiques */}
          <div className="provider-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{providers.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activés:</span>
              <span className="stat-value">
                {providers.filter(p => p.enabled).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Configurés:</span>
              <span className="stat-value">
                {providers.filter(p => p.apiKeyConfigured).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};