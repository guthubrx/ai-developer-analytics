import React from 'react';
import type { Message, Settings } from '../types';

interface MessageBubbleProps {
  message: Message;
  settings: Settings;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings }) => {
  const isUser = message.type === 'user';
  const isAI = message.type === 'ai';
  const isError = message.type === 'error';

  const formatContent = (content: string) => {
    // Simple markdown-like formatting for code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const formattedContent = content.replace(codeBlockRegex, (match, language, code) => {
      return `<pre class="code-block"><code class="language-${language || 'text'}">${code.trim()}</code></pre>`;
    });

    return { __html: formattedContent };
  };

  return (
    <div className={`message-bubble ${message.type}`}>
      <div className="message-header">
        <span className="message-sender">
          {isUser ? 'You' : message.provider || 'AI'}
        </span>
        <span className="message-time">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>

      <div
        className="message-content"
        dangerouslySetInnerHTML={formatContent(message.content)}
      />

      {isAI && message.metadata && (
        <div className="message-metadata">
          {message.metadata.tokens && (
            <span className="metadata-item">Tokens: {message.metadata.tokens}</span>
          )}
          {message.metadata.cost && (
            <span className="metadata-item">Cost: ${message.metadata.cost.toFixed(6)}</span>
          )}
          {message.metadata.latency && (
            <span className="metadata-item">Latency: {message.metadata.latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
};