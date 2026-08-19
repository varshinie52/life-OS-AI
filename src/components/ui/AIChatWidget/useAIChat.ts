'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLifeOS, getLifeOSSnapshot } from '@/context/LifeOSContext';
import { parseAndExecuteAIAction } from '@/lib/aiActionDispatcher';
import { getToday } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  pendingAction?: {
    action: string;
    payload: Record<string, unknown>;
    confirmText: string;
    taskId?: string;
  };
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

const QUICK_PROMPTS = [
  { icon: '🎯', label: 'What should I do today?', text: 'What should I do today?' },
  { icon: '📊', label: 'How am I doing?', text: 'How am I doing?' },
  { icon: '💻', label: 'Add DSA into habit', text: 'Add DSA into habit' },
  { icon: '🔥', label: 'Show my habits', text: 'Show my habits' },
  { icon: '📋', label: "Today's tasks", text: 'Show pending tasks' },
  { icon: '📝', label: 'Create React note', text: 'Create a note called React Hooks' },
];

export { QUICK_PROMPTS };

export function useAIChat() {
  const { authFetch, user } = useAuth();
  const lifeOS = useLifeOS();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Initialize welcome message
  const initializeChat = useCallback(() => {
    if (hasInitialized) return;
    setHasInitialized(true);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user?.name?.split(' ')[0] || 'there';

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}, **${name}** 👋\n\nI'm **LifeOS AI** — your connected action assistant. I have full real-time awareness of your habits, tasks, calendar, journal, and analytics.\n\nTry quick actions below or ask me *"What should I do today?"* or *"Add DSA into habit"*!`,
        timestamp: new Date(),
      },
    ]);
  }, [hasInitialized, user]);

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      initializeChat();
    }
  }, [isOpen, hasInitialized, initializeChat]);

  const sendMessage = useCallback(async (text: string, isConfirmed: boolean = false) => {
    if (!text.trim() || isLoading) return;

    // Abort previous pending network request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Step 1: Instant local intent parsing & action execution on LifeOSContext
      const actionResult = parseAndExecuteAIAction(text, lifeOS, isConfirmed);

      if (actionResult.handled) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: actionResult.reply,
          timestamp: new Date(),
          pendingAction: actionResult.pendingAction,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }

      // Step 2: Compact LifeOS Context Payload for backend API
      const lifeOSContextPayload = getLifeOSSnapshot(lifeOS);

      try {
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await authFetch(`${API_URL}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify({ message: text.trim(), history, context: lifeOSContextPayload }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.reply) {
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.data.reply,
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }

      // Smart contextual fallback based on live metrics
      const fallbackReply =
        `I am tracking your LifeOS system live!\n\n` +
        `• **Active Habits:** ${lifeOS.habits.length} habits tracked (${lifeOS.metrics.currentHabitStreak} Day Best Streak 🔥)\n` +
        `• **Active Tasks:** ${lifeOS.metrics.tasksPending} pending, ${lifeOS.metrics.tasksCompleted} completed\n` +
        `• **Productivity Score:** ${lifeOS.metrics.productivityScore}%\n\n` +
        `Ask me to *"Add task [name]"*, *"Add [name] into habit"*, *"What should I do today?"*, or *"How am I doing?"*`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'LifeOS AI encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isLoading, lifeOS, messages]);

  const executeAction = useCallback(async (
    action: string,
    payload: Record<string, unknown>,
    confirmed = false
  ) => {
    if (confirmed) {
      if (action === 'clearAllTasks') lifeOS.clearAllTasks();
      if (action === 'clearAllHabits') lifeOS.clearAllHabits();
      if (action === 'clearAllNotes') lifeOS.clearAllNotes();
      if (action === 'clearAllJournalEntries') lifeOS.clearAllJournalEntries();

      setMessages((prev) => [
        ...prev,
        {
          id: `action-confirm-${Date.now()}`,
          role: 'assistant',
          content: `✓ **Action confirmed and executed.**`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [lifeOS]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setHasInitialized(false);
    setTimeout(initializeChat, 50);
  }, [initializeChat]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  return {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    executeAction,
    clearConversation,
    openChat,
    closeChat,
    toggleChat,
    messagesEndRef,
    inputRef,
    QUICK_PROMPTS,
  };
}
