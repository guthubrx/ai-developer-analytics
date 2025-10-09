import { useState, useEffect, useCallback } from 'react';
import type { VSCodeAPI, Session, Message } from '../types';

export const useSessions = (vscode: VSCodeAPI) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSession = sessions.find(session => session.id === currentSessionId) || sessions[0];

  const createSession = useCallback(() => {
    const newSession: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Session ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
      isActive: true,
    };

    setSessions(prev => {
      const updatedSessions = prev.map(session => ({
        ...session,
        isActive: false,
      }));

      return [...updatedSessions, newSession];
    });

    setCurrentSessionId(newSession.id);
  }, [sessions.length]);

  const switchSession = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(session => ({
        ...session,
        isActive: session.id === sessionId,
      }))
    );
    setCurrentSessionId(sessionId);
  }, []);

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    );
  }, []);

  // Initialize with a default session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  return {
    sessions,
    currentSession,
    createSession,
    switchSession,
    addMessage,
  };
};