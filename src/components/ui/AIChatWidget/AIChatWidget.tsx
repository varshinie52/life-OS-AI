'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Minus,
} from 'lucide-react';
import { useAIChat, QUICK_PROMPTS } from './useAIChat';
import MarkdownRenderer from './MarkdownRenderer';
import styles from './AIChatWidget.module.css';

// ─── Format timestamp ────────────────────────
const formatTime = (d: Date) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── Typing Indicator ────────────────────────
const TypingIndicator = () => (
  <div className={styles.typingRow}>
    <div className={`${styles.msgAvatar} ${styles.msgAvatarAI}`}>
      <Bot size={14} />
    </div>
    <div className={styles.typingBubble}>
      <div className={styles.typingDot} />
      <div className={styles.typingDot} />
      <div className={styles.typingDot} />
    </div>
  </div>
);

// ─── Main Widget ─────────────────────────────
export default function AIChatWidget() {
  const {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    executeAction,
    clearConversation,
    toggleChat,
    closeChat,
    messagesEndRef,
  } = useAIChat();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
    }
  }, [input]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (text: string) => {
    sendMessage(text);
  };

  const showEmptyState = messages.length === 0 && !isLoading;
  const showWelcomePrompts = messages.length === 1 && messages[0].id === 'welcome' && !isLoading;

  return (
    <>
      {/* ── Floating Trigger Button ────────────────── */}
      <motion.button
        className={styles.triggerBtn}
        onClick={toggleChat}
        aria-label="Toggle LifeOS AI"
        id="ai-chat-trigger"
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Minus size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sparkles size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && <span className={styles.triggerBadge}>AI</span>}
      </motion.button>

      {/* ── Chat Panel (Right-Side Drawer) ───────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerAvatar}>
                <Sparkles size={16} />
              </div>
              <div className={styles.headerInfo}>
                <div className={styles.headerTitle}>LifeOS AI</div>
                <div className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  Online · Personal coach
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.iconBtn}
                  onClick={clearConversation}
                  title="New conversation"
                  aria-label="New conversation"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={closeChat}
                  title="Close"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages} ref={messagesContainerRef}>
              <AnimatePresence initial={false}>
                {showEmptyState ? (
                  <EmptyState onPromptClick={handleQuickPrompt} />
                ) : (
                  <>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`${styles.msgAvatar} ${msg.role === 'user' ? styles.msgAvatarUser : styles.msgAvatarAI}`}>
                          {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                        </div>

                        {/* Content */}
                        <div className={styles.msgContent}>
                          <div className={`${styles.bubble} ${
                            msg.role === 'user'
                              ? styles.bubbleUser
                              : msg.isError
                              ? `${styles.bubbleAI} ${styles.bubbleError}`
                              : styles.bubbleAI
                          }`}>
                            {msg.role === 'user' ? (
                              <span style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                            ) : (
                              <MarkdownRenderer content={msg.content} />
                            )}
                          </div>

                          {/* Confirmation UI for destructive actions */}
                          {msg.pendingAction && (
                            <div className={styles.confirmRow}>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnDanger}`}
                                onClick={() =>
                                  executeAction(
                                    msg.pendingAction!.action,
                                    msg.pendingAction!.payload,
                                    true
                                  )
                                }
                              >
                                Confirm
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnCancel}`}
                                onClick={() =>
                                  sendMessage('Cancel that action.')
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Message meta */}
                          <div className={styles.msgMeta} style={msg.role === 'user' ? { justifyContent: 'flex-end' } : {}}>
                            <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                            {msg.role === 'assistant' && (
                              <button
                                className={styles.msgCopyBtn}
                                onClick={() => handleCopy(msg.id, msg.content)}
                                aria-label="Copy message"
                              >
                                {copiedId === msg.id ? (
                                  <><Check size={10} color="var(--moss)" /> Copied</>
                                ) : (
                                  <><Copy size={10} /> Copy</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Show quick prompts after welcome message */}
                    {showWelcomePrompts && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.quickPrompts}
                        style={{ marginTop: 4 }}
                      >
                        {QUICK_PROMPTS.map((p) => (
                          <button
                            key={p.label}
                            className={styles.quickPromptBtn}
                            onClick={() => handleQuickPrompt(p.text)}
                          >
                            <span className={styles.quickPromptIcon}>{p.icon}</span>
                            {p.label}
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {isLoading && <TypingIndicator />}
                  </>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
              <div className={styles.inputRow}>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  placeholder="Ask about your habits, tasks, progress…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isLoading}
                  aria-label="Message input"
                  id="ai-chat-input"
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  id="ai-chat-send"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Empty State with Quick Prompts ──────────
function EmptyState({ onPromptClick }: { onPromptClick: (text: string) => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Sparkles size={24} />
      </div>
      <div className={styles.emptyTitle}>LifeOS AI</div>
      <p className={styles.emptySubtitle}>Your personal productivity coach</p>
      <div className={styles.quickPrompts}>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            className={styles.quickPromptBtn}
            onClick={() => onPromptClick(p.text)}
          >
            <span className={styles.quickPromptIcon}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
