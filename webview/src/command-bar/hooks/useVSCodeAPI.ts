import { useState, useEffect, useCallback } from 'react';
import type { VSCodeAPI } from '../types';

export const useVSCodeAPI = (vscode: VSCodeAPI) => {
  const [isReady, setIsReady] = useState(false);

  const postMessage = useCallback((message: any) => {
    vscode.postMessage(message);
  }, [vscode]);

  useEffect(() => {
    // Notify extension that webview is ready
    postMessage({ type: 'webviewReady' });
    setIsReady(true);
  }, [postMessage]);

  return {
    isReady,
    postMessage,
  };
};