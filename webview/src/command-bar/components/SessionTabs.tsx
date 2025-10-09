import React from 'react';
import type { Session } from '../types';

interface SessionTabsProps {
  sessions: Session[];
  currentSession: Session | undefined;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
}

export const SessionTabs: React.FC<SessionTabsProps> = ({
  sessions,
  currentSession,
  onCreateSession,
  onSwitchSession,
}) => {
  return (
    <div className="session-tabs">
      <div className="tabs-container">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`tab ${session.id === currentSession?.id ? 'active' : ''}`}
            onClick={() => onSwitchSession(session.id)}
          >
            {session.name}
          </div>
        ))}
        <button
          className="new-session-btn"
          onClick={onCreateSession}
          title="New Session"
        >
          +
        </button>
      </div>
    </div>
  );
};