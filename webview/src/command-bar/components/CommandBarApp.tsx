import React, { useState, useEffect, useCallback } from 'react';
import { SessionTabs } from './SessionTabs';
import { ConversationArea } from './ConversationArea';
import { InputPanel } from './InputPanel';
import { CoachingSection } from './CoachingSection';
import { MetricsDisplay } from './MetricsDisplay';
import { ProviderStatus } from './ProviderStatus';
import { useVSCodeAPI } from '../hooks/useVSCodeAPI';
import { useSettings } from '../hooks/useSettings';
import { useSessions } from '../hooks/useSessions';
import type { VSCodeAPI, Message, Session, Settings, Metrics } from '../types';

interface CommandBarAppProps {
  vscode: VSCodeAPI;
}

export const CommandBarApp: React.FC<CommandBarAppProps> = ({ vscode }) => {
  const { settings, updateSettings } = useSettings(vscode);
  const { sessions, currentSession, createSession, switchSession, addMessage, updateMessage } = useSessions(vscode);
  const [metrics, setMetrics] = useState<Metrics>({
    totalCost: 0,
    totalTokens: 0,
    latestLatency: 0,
    cacheHits: 0,
    totalRequests: 0
  });
  const [coachingAdvice, setCoachingAdvice] = useState<string>('');
  const [currentAIMessageId, setCurrentAIMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [providers, setProviders] = useState<any[]>([]);

  // Handle messages from extension
  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data;

    switch (message.type) {
      case 'settingsUpdated':
        updateSettings(message.settings);
        break;

      case 'executionStarted':
        // Add user message to conversation
        if (currentSession) {
          const userMessage: Message = {
            id: `msg-${Date.now()}-user`,
            type: 'user',
            content: message.prompt,
            timestamp: new Date()
          };
          addMessage(currentSession.id, userMessage);
        }
        break;

      case 'streamingStarted':
        // Create AI message placeholder for streaming
        if (currentSession) {
          const aiMessageId = `msg-${Date.now()}-ai`;
          setCurrentAIMessageId(aiMessageId);
          setStreamingContent('');

          const aiMessage: Message = {
            id: aiMessageId,
            type: 'ai',
            content: '',
            timestamp: new Date(),
            provider: message.provider
          };
          addMessage(currentSession.id, aiMessage);
        }
        break;

      case 'streamingChunk':
        // Update existing AI message with accumulated content
        if (currentSession && currentAIMessageId) {
          setStreamingContent(prev => {
            const newContent = prev + message.content;
            updateMessage(currentSession.id, currentAIMessageId, {
              content: newContent
            });
            return newContent;
          });
        }
        break;

      case 'executionCompleted':
        // Update existing AI message with final content and metadata
        if (currentSession && currentAIMessageId) {
          updateMessage(currentSession.id, currentAIMessageId, {
            content: message.response,
            provider: message.provider,
            model: message.model,
            metadata: {
              tokens: message.tokens,
              cost: message.cost,
              latency: message.latency
            }
          });
        }

        // Reset streaming state
        setCurrentAIMessageId(null);
        setStreamingContent('');

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          totalCost: prev.totalCost + (message.cost || 0),
          totalTokens: prev.totalTokens + (message.tokens || 0),
          latestLatency: message.latency || 0,
          totalRequests: prev.totalRequests + 1,
          cacheHits: prev.cacheHits + (message.cacheHit ? 1 : 0)
        }));
        break;

      case 'coachingAdvice':
        setCoachingAdvice(message.advice);
        break;

      case 'metricsLoaded':
        setMetrics(message.metrics);
        break;

      case 'providersStatus':
        setProviders(message.providers);
        break;
    }
  }, [updateSettings, currentSession, addMessage, updateMessage, currentAIMessageId, sessions]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    // Request initial settings and metrics
    vscode.postMessage({ type: 'getSettings' });
    vscode.postMessage({ type: 'loadMetrics' });
    vscode.postMessage({ type: 'getProvidersStatus' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode, handleMessage]);

  const handleExecutePrompt = useCallback((prompt: string, routingMode: string, provider?: string) => {
    vscode.postMessage({
      type: 'executePrompt',
      prompt,
      routingMode,
      provider,
      conversationContext: currentSession?.messages || []
    });
  }, [vscode, currentSession]);

  const handleUpdateSettings = useCallback((newSettings: Partial<Settings>) => {
    vscode.postMessage({
      type: 'updateSettings',
      settings: newSettings
    });
  }, [vscode]);

  if (!settings) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading AI Command Bar...</div>
      </div>
    );
  }

  return (
    <div className="command-bar-app">
      <SessionTabs
        sessions={sessions}
        currentSession={currentSession}
        onCreateSession={createSession}
        onSwitchSession={switchSession}
      />

      <div className="main-content">
        <ConversationArea
          messages={currentSession?.messages || []}
          settings={settings}
        />

        {settings.coachEnabled && (
          <CoachingSection
            advice={coachingAdvice}
            isCollapsed={settings.coachCollapsedByDefault}
          />
        )}

        <InputPanel
          onExecutePrompt={handleExecutePrompt}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          vscode={vscode}
        />

        {settings.showMetrics && (
          <MetricsDisplay metrics={metrics} />
        )}

        {providers.length > 0 && (
          <ProviderStatus
            providers={providers}
            isCollapsed={settings.providerStatusCollapsedByDefault}
          />
        )}
      </div>
    </div>
  );
};