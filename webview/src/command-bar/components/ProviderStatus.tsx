import React, { useState } from 'react';

interface ProviderStatusInfo {
  providerId: string;
  providerName: string;
  status: 'connected' | 'unconfigured' | 'auth_error' | 'network_error' | 'api_error' | 'disabled' | 'unknown';
  errorMessage?: string;
  lastChecked?: string;
  lastLatency?: number;
}

interface ProviderStatusProps {
  providers: ProviderStatusInfo[];
  isCollapsed?: boolean;
}

export const ProviderStatus: React.FC<ProviderStatusProps> = ({ providers, isCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'unconfigured':
        return '⚙️';
      case 'auth_error':
        return '🔑';
      case 'network_error':
        return '🌐';
      case 'api_error':
        return '⚠️';
      case 'disabled':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connecté';
      case 'unconfigured':
        return 'Non configuré';
      case 'auth_error':
        return 'Erreur auth';
      case 'network_error':
        return 'Erreur réseau';
      case 'api_error':
        return 'Erreur API';
      case 'disabled':
        return 'Désactivé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return '#10b981';
      case 'unconfigured':
        return '#6b7280';
      case 'auth_error':
        return '#ef4444';
      case 'network_error':
        return '#f59e0b';
      case 'api_error':
        return '#f97316';
      case 'disabled':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const connectedCount = providers.filter(p => p.status === 'connected').length;
  const totalCount = providers.length;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="provider-status">
      <div
        className="provider-status-header"
        onClick={toggleCollapse}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3>Statut des Providers</h3>
          <span className="collapse-icon">
            {collapsed ? '▶' : '▼'}
          </span>
        </div>
        <span className="provider-count">
          {connectedCount}/{totalCount} connectés
        </span>
      </div>

      {!collapsed && (
        <div className="provider-list">
          {providers.map(provider => (
            <div key={provider.providerId} className="provider-item">
              <div className="provider-info">
                <span
                  className="provider-icon"
                  style={{ color: getStatusColor(provider.status) }}
                >
                  {getStatusIcon(provider.status)}
                </span>
                <div className="provider-details">
                  <div className="provider-name">
                    {provider.providerName}
                  </div>
                  <div className="provider-status-text">
                    {getStatusText(provider.status)}
                    {provider.lastLatency && (
                      <span className="provider-latency">
                        ({provider.lastLatency}ms)
                      </span>
                    )}
                  </div>
                  {provider.errorMessage && (
                    <div className="provider-error">
                      {provider.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};