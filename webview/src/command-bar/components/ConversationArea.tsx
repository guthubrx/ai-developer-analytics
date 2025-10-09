import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message, Settings } from '../types';

interface ConversationAreaProps {
  messages: Message[];
  settings: Settings;
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  messages,
  settings,
}) => {
  return (
    <div className="conversation-area">
      <div className="conversation-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>Welcome to AI Command Bar</h3>
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                settings={settings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};