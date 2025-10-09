import React from 'react';
import type { Settings } from '../types';

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
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  settings,
  onChange,
  onUpdateSettings,
}) => {
  const isManualMode = configuration.mode === 'manual';

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
                onChange={(e) => onChange({ provider: e.target.value })}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="deepseek">DeepSeek</option>
                <option value="moonshot">Moonshot</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>

            <div className="dropdown-wrapper">
              <span className="dropdown-icon">🤖</span>
              <select
                value={configuration.model}
                onChange={(e) => onChange({ model: e.target.value })}
                style={{ fontSize: `${settings.dropdownFontSize}px` }}
              >
                <option value="">Select Model</option>
                {/* Models will be populated dynamically */}
              </select>
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