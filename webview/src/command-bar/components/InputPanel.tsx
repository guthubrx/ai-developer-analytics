import React, { useState, useCallback } from 'react';
import { ConfigurationPanel } from './ConfigurationPanel';
import type { Settings } from '../types';

interface InputPanelProps {
  onExecutePrompt: (prompt: string, routingMode: string, provider?: string) => void;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  vscode: any;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onExecutePrompt,
  settings,
  onUpdateSettings,
  vscode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [configuration, setConfiguration] = useState({
    mode: settings.defaultMode || 'auto',
    provider: settings.defaultEngine || 'deepseek',
    model: '',
    task: settings.defaultTaskType || 'general',
    routingMode: settings.routingMode || 'normal',
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (configuration.mode === 'manual') {
      onExecutePrompt(prompt, configuration.routingMode, configuration.provider);
    } else {
      onExecutePrompt(prompt, configuration.routingMode);
    }

    setPrompt('');
  }, [prompt, configuration, onExecutePrompt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleConfigurationChange = useCallback((newConfig: Partial<typeof configuration>) => {
    setConfiguration(prev => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <div className="input-panel">
      <ConfigurationPanel
        configuration={configuration}
        settings={settings}
        onChange={handleConfigurationChange}
        onUpdateSettings={onUpdateSettings}
        vscode={vscode}
      />

      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question…"
            className="prompt-input"
            style={{
              fontSize: `${settings.inputFontSize}px`,
              fontFamily: settings.commandBarFontFamily,
            }}
            rows={1}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!prompt.trim()}
          >
            ⏎
          </button>
        </div>
      </form>
    </div>
  );
};