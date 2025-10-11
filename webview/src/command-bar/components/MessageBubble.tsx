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
    let formattedContent = content;

    // Format code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    formattedContent = formattedContent.replace(codeBlockRegex, (match, language, code) => {
      return `<pre class="code-block"><code class="language-${language || 'text'}">${code.trim()}</code></pre>`;
    });

    // Format inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    formattedContent = formattedContent.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');

    // Format bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    formattedContent = formattedContent.replace(boldRegex, '<strong>$1</strong>');

    // Format italic text
    const italicRegex = /\*(.*?)\*/g;
    formattedContent = formattedContent.replace(italicRegex, '<em>$1</em>');

    // Convert line breaks to <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return { __html: formattedContent };
  };

  // Get model name for display - use model if available, otherwise provider
  const getModelName = () => {
    if (message.model) {
      return message.model;
    }
    if (message.provider) {
      return message.provider;
    }
    return 'AI';
  };

  return (
    <div className={`message-container ${message.type}`}>
      <div className="message-header">
        <span className="message-sender">
          {isUser ? 'You' : getModelName()}
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