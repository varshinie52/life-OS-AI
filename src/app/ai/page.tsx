'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  RotateCcw,
  Sun,
  Calendar,
  Brain,
  Check,
  Flame,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  CheckSquare,
  Zap,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLifeOS, getLifeOSSnapshot } from '@/context/LifeOSContext';
import { parseAndExecuteAIAction } from '@/lib/aiActionDispatcher';
import MarkdownRenderer from '@/components/ui/AIChatWidget/MarkdownRenderer';
import styles from './page.module.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface AIInsight {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  color: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame size={18} />,
  Target: <Target size={18} />,
  AlertCircle: <AlertCircle size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  TrendingDown: <TrendingDown size={18} />,
  CheckSquare: <CheckSquare size={18} />,
  Zap: <Zap size={18} />,
  Brain: <Brain size={18} />,
};

const SUGGESTED_PROMPTS = [
  { icon: '📊', text: 'What did I accomplish today?' },
  { icon: '🎯', text: 'Create a DSA task for tomorrow.' },
  { icon: '🔥', text: 'Which habits do I have the best streaks on?' },
  { icon: '📅', text: 'Add a mock interview on Friday at 10 AM.' },
  { icon: '📝', text: 'Create a note called React Hooks.' },
  { icon: '✅', text: 'Mark my React task as completed.' },
  { icon: '💪', text: 'Motivate me based on my actual recent progress.' },
  { icon: '🔍', text: 'Show my pending tasks.' },
];

const formatTime = (d: Date) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function AIPage() {
  const { authFetch, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const lifeOS = useLifeOS();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'weekly'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const loadInitialData = useCallback(async () => {
    const name = user?.name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `${greet}, **${name}** 👋\n\nI'm **LifeOS AI** — your personal productivity coach. I have live access to your habits, tasks, journal, and analytics.\n\nAsk me anything about your data, or try one of the prompts below.`,
      timestamp: new Date(),
    }]);

    try {
      setInsightsLoading(true);
      const res = await authFetch(`${API_URL}/ai/insights`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setInsights(data.data.insights || []);
      }
    } catch { /* silent */ } finally {
      setInsightsLoading(false);
    }
  }, [authFetch, user, API_URL]);

  useEffect(() => {
    if (isAuthenticated) loadInitialData();
  }, [isAuthenticated, loadInitialData]);

  const handleSend = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Execute Action locally on LifeOSContext
      const actionResult = parseAndExecuteAIAction(text, lifeOS);
      if (actionResult.handled) {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: actionResult.reply,
          timestamp: new Date(),
        }]);
        setLoading(false);
        return;
      }

      // Try remote API
      try {
        const history = messages.filter((m) => m.id !== 'welcome').slice(-20).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await authFetch(`${API_URL}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history, context: getLifeOSSnapshot(lifeOS) }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.reply) {
            setMessages((prev) => [...prev, {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: data.data.reply,
              timestamp: new Date(),
            }]);
            setLoading(false);
            return;
          }
        }
      } catch { /* silent */ }

      // Contextual fallback
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `I am connected to your live LifeOS system!\n\n` +
                 `• **Tasks Pending:** ${lifeOS.metrics.tasksPending}\n` +
                 `• **Habit Streak:** ${lifeOS.metrics.currentHabitStreak} Days 🔥\n` +
                 `• **Productivity Score:** ${lifeOS.metrics.productivityScore}%\n\n` +
                 `Try asking me: *"Add task DSA Practice"*, *"Mark exercise as complete"*, or *"What did I accomplish today?"*`,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'LifeOS AI is temporarily unavailable. Please try again.',
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) handleSend(lastUser.content);
  };

  const handleWeeklyReview = async () => {
    if (weeklyReview) { setActiveTab('weekly'); return; }
    setReviewLoading(true);
    setActiveTab('weekly');
    try {
      const res = await authFetch(`${API_URL}/ai/weekly-review`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setWeeklyReview(data.data.review);
      }
    } catch { showToast('Failed to load weekly review', 'error'); }
    finally { setReviewLoading(false); }
  };

  const clearChat = () => {
    setMessages([]);
    loadInitialData();
  };

  const showPrompts = messages.length === 1 && messages[0].id === 'welcome' && !loading;

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────── */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className={styles.title}>
            <Sparkles size={26} color="var(--moss)" style={{ display: 'inline', marginRight: 10, verticalAlign: '-4px' }} />
            LifeOS AI
          </h1>
          <p className={styles.subtitle}>
            Your personal productivity coach — connected to your real LifeOS data.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={15} /> Chat
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'weekly' ? styles.tabBtnActive : ''}`}
            onClick={handleWeeklyReview}
          >
            <Calendar size={15} /> Weekly Review
          </button>
        </div>
      </motion.div>

      {/* ── Layout Grid ───────────────────────────── */}
      <div className={styles.layoutGrid}>

        {/* ── Main Panel ────────────────────────────── */}
        <motion.div
          className={styles.mainPanel}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <AnimatePresence mode="wait">
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                className={styles.chatContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Messages */}
                <div className={styles.messagesList}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : ''}`}
                    >
                      <div className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarAI}`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={styles.msgContent}>
                        <div className={`${styles.bubble} ${
                          msg.role === 'user' ? styles.bubbleUser
                          : msg.isError ? `${styles.bubbleAI} ${styles.bubbleError}`
                          : styles.bubbleAI
                        }`}>
                          {msg.role === 'user'
                            ? <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.93rem' }}>{msg.content}</span>
                            : <MarkdownRenderer content={msg.content} />
                          }
                        </div>
                        <div className={`${styles.msgMeta} ${msg.role === 'user' ? styles.msgMetaUser : ''}`}>
                          <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                          {msg.role === 'assistant' && (
                            <>
                              <button className={styles.metaBtn} onClick={() => handleCopy(msg.id, msg.content)}>
                                {copiedId === msg.id ? <><Check size={11} color="var(--moss)" /> Copied</> : <><Copy size={11} /> Copy</>}
                              </button>
                              <button className={styles.metaBtn} onClick={handleRegenerate}>
                                <RotateCcw size={11} /> Retry
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Quick prompts after welcome */}
                  {showPrompts && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.promptsGrid}
                    >
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button key={p.text} className={styles.promptChip} onClick={() => handleSend(p.text)}>
                          <span>{p.icon}</span> {p.text.slice(0, 42)}…
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.messageRow}>
                      <div className={`${styles.avatar} ${styles.avatarAI}`}><Bot size={14} /></div>
                      <div className={styles.bubble} style={{
                        background: 'var(--surface-solid)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px 18px 18px 18px',
                        display: 'flex', gap: 6, padding: '12px 16px',
                      }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className={styles.inputBar}>
                  <div className={styles.inputRow}>
                    <textarea
                      ref={textareaRef}
                      className={styles.textarea}
                      placeholder="Ask about your habits, tasks, streaks, or get coaching…"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={loading}
                    />
                    <div className={styles.inputBtns}>
                      <button className={styles.iconBtn} onClick={clearChat} title="New chat">
                        <RotateCcw size={15} />
                      </button>
                      <button
                        className={styles.sendBtn}
                        onClick={() => handleSend()}
                        disabled={!inputMessage.trim() || loading}
                      >
                        {loading ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
                </div>
              </motion.div>
            )}

            {/* Weekly Review Tab */}
            {activeTab === 'weekly' && (
              <motion.div
                key="weekly"
                className={styles.weeklyContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.weeklyHeader}>
                  <Sun size={20} color="var(--sand)" />
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-body)', margin: 0 }}>
                      Weekly AI Review
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      AI-powered analysis of your past 7 days
                    </p>
                  </div>
                </div>

                {reviewLoading ? (
                  <div className={styles.reviewLoading}>
                    <Loader2 size={28} className={styles.spinning} color="var(--accent-primary)" />
                    <p>Analyzing your week…</p>
                  </div>
                ) : weeklyReview ? (
                  <div className={styles.weeklyContent}>
                    <MarkdownRenderer content={weeklyReview} />
                  </div>
                ) : (
                  <div className={styles.weeklyContent}>
                    <MarkdownRenderer content={
                      `### Weekly Productivity Analysis 📊\n\n` +
                      `* **Total Tasks Done:** ${lifeOS.metrics.tasksCompleted}\n` +
                      `* **Habits Logged:** ${lifeOS.metrics.habitsCompletedToday} logged today\n` +
                      `* **Overall Consistency:** ${lifeOS.metrics.productivityScore}%\n` +
                      `* **Active Habit Streak:** ${lifeOS.metrics.currentHabitStreak} Days 🔥\n\n` +
                      `Maintain your morning exercise & study habits to keep your weekly score above 80%!`
                    } />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Sidebar ───────────────────────────────── */}
        <motion.div
          className={styles.sidebar}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          {/* Live Insights */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>
              <Brain size={16} color="var(--moss)" /> Live Insights
            </div>
            {insightsLoading ? (
              <div className={styles.insightSkeleton} />
            ) : (
              <div className={styles.insightsList}>
                <div className={styles.insightCard} style={{ borderLeftColor: '#6B7F4E' }}>
                  <div className={styles.insightHeader}>
                    <span style={{ color: '#6B7F4E' }}><Flame size={16} /></span>
                    <span className={styles.insightTitle}>Streak Momentum</span>
                    <span className={styles.insightCategory}>Habits</span>
                  </div>
                  <p className={styles.insightDesc}>You have a {lifeOS.metrics.currentHabitStreak}-day streak on your active habits. Keep momentum!</p>
                </div>
                <div className={styles.insightCard} style={{ borderLeftColor: '#4C6A73' }}>
                  <div className={styles.insightHeader}>
                    <span style={{ color: '#4C6A73' }}><CheckSquare size={16} /></span>
                    <span className={styles.insightTitle}>Task Output</span>
                    <span className={styles.insightCategory}>Tasks</span>
                  </div>
                  <p className={styles.insightDesc}>{lifeOS.metrics.tasksCompleted} tasks completed with {lifeOS.metrics.tasksPending} remaining.</p>
                </div>
              </div>
            )}
          </div>

          {/* Daily Brief Button */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>
              <Sun size={16} color="var(--sand)" /> Daily Brief
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Get a personalized overview of your day using real data.
            </p>
            <button
              className={styles.briefBtn}
              onClick={async () => {
                setActiveTab('chat');
                setLoading(true);
                setTimeout(() => {
                  setMessages((prev) => [...prev, {
                    id: `brief-${Date.now()}`,
                    role: 'assistant',
                    content: `### Daily AI Brief ☀️\n\n` +
                             `• **Tasks:** ${lifeOS.metrics.tasksCompleted}/${lifeOS.metrics.tasksTotal} completed\n` +
                             `• **Habits:** ${lifeOS.metrics.habitsCompletedToday}/${lifeOS.metrics.habitsTotalToday} done today\n` +
                             `• **Active Streak:** ${lifeOS.metrics.currentHabitStreak} Days 🔥\n` +
                             `• **Score:** ${lifeOS.metrics.productivityScore}%`,
                    timestamp: new Date(),
                  }]);
                  setLoading(false);
                }, 400);
              }}
            >
              <Sun size={15} /> Get Today&apos;s Brief
            </button>
          </div>

          {/* Quick Prompts */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>
              <Zap size={16} color="var(--moss)" /> Quick Actions
            </div>
            <div className={styles.sidePrompts}>
              {SUGGESTED_PROMPTS.slice(0, 5).map((p) => (
                <button
                  key={p.text}
                  className={styles.sidePromptBtn}
                  onClick={() => { setActiveTab('chat'); handleSend(p.text); }}
                >
                  {p.icon} {p.text.slice(0, 38)}…
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
