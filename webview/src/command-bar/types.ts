// VS Code API types
export interface VSCodeAPI {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

// Message types
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'error';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  metadata?: {
    tokens?: number;
    cost?: number;
    latency?: number;
  };
}

// Session types
export interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  isActive: boolean;
}

// Settings types
export interface Settings {
  ollamaEnabled: boolean;
  ollamaUrl: string;
  defaultOllamaModel: string;
  routingMode: string;
  telemetryEnabled: boolean;
  hotReloadEnabled: boolean;
  commandBarFontFamily: string;
  commandBarFontSize: number;
  chatFontSize: number;
  aiResponseFontSize: number;
  codeBlockFontSize: number;
  inlineCodeFontSize: number;
  inputFontSize: number;
  dropdownFontSize: number;
  coachFontSize: number;
  metricsFontSize: number;
  defaultEngine: string;
  defaultTaskType: string;
  defaultMode: string;
  moonshotDefaultModel: string;
  accentColor: string;
  showMetrics: boolean;
  coachEnabled: boolean;
  coachCollapsedByDefault: boolean;
  sessionTabsEnabled: boolean;
  autoExpandTextarea: boolean;
  streamingEnabled: boolean;
  openaiApiKey: string;
  anthropicApiKey: string;
  deepseekApiKey: string;
  moonshotApiKey: string;
}

// Metrics types
export interface Metrics {
  totalCost: number;
  totalTokens: number;
  latestLatency: number;
  cacheHits: number;
  totalRequests: number;
  buildTimestamp?: string;
  version?: string;
}

// Provider types
export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  isAvailable: boolean;
}

// Configuration types
export interface Configuration {
  mode: 'manual' | 'auto';
  provider?: string;
  model?: string;
  task?: string;
  routingMode?: string;
}