import { useState, useEffect, useCallback } from 'react';
import type { VSCodeAPI, Settings } from '../types';

export const useSettings = (vscode: VSCodeAPI) => {
  const [settings, setSettings] = useState<Settings | null>({
    // Mock settings for browser development
    coachEnabled: true,
    coachCollapsedByDefault: false,
    showMetrics: true,
    defaultEngine: 'deepseek',
    defaultTaskType: 'general',
    defaultMode: 'auto',
    accentColor: '#5B7FED',
    sessionTabsEnabled: true,
    autoExpandTextarea: true,
    streamingEnabled: true,
    routingMode: 'auto-local',
    ollamaEnabled: true,
    ollamaUrl: 'http://localhost:11434',
    defaultOllamaModel: 'phi-4',
    telemetryEnabled: true,
    hotReloadEnabled: true,
    deepseekApiKey: '',
    apiTimeout: 60000,
    commandBarFontFamily: 'var(--vscode-editor-font-family)',
    commandBarFontSize: 13,
    chatFontSize: 13,
    aiResponseFontSize: 13,
    codeBlockFontSize: 12,
    inlineCodeFontSize: 12,
    inputFontSize: 14,
    dropdownFontSize: 11,
    coachFontSize: 13,
    metricsFontSize: 9,
    openaiApiKey: '',
    anthropicApiKey: '',
    moonshotApiKey: '',
    moonshotDefaultModel: 'moonshot-v1-8k'
  });

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'settingsUpdated') {
        setSettings(message.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return {
    settings,
    updateSettings,
  };
};