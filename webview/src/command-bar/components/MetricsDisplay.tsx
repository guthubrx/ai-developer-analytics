import React from 'react';
import type { Metrics } from '../types';

interface MetricsDisplayProps {
  metrics: Metrics;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  const cacheHitRate = metrics.totalRequests > 0
    ? (metrics.cacheHits / metrics.totalRequests) * 100
    : 0;

  return (
    <div className="metrics-display">
      <div className="metrics-row">
        <span className="metric-item">
          <strong>Cost:</strong> ${metrics.totalCost.toFixed(6)}
        </span>
        <span className="metric-item">
          <strong>Tokens:</strong> {metrics.totalTokens.toLocaleString()}
        </span>
        <span className="metric-item">
          <strong>Latency:</strong> {(metrics.latestLatency / 1000).toFixed(2)}s
        </span>
        <span className="metric-item">
          <strong>Cache:</strong> {cacheHitRate.toFixed(0)}%
        </span>
        <span className="metric-item">
          <strong>Requests:</strong> {metrics.totalRequests}
        </span>
      </div>
    </div>
  );
};