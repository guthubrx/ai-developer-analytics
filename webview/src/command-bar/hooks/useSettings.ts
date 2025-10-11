import { useState, useEffect, useCallback } from 'react';
import type { VSCodeAPI, Settings } from '../types';

export const useSettings = (vscode: VSCodeAPI) => {
  const [settings, setSettings] = useState<Settings | null>(null);

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