"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, Sparkles, Zap, Command, History } from 'lucide-react';
import styles from './page.module.css';
import { useAppContext } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIPage() {
  const { isMounted, userName } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${userName}! I'm your LifeOS AI Assistant. I can help you analyze your habits, summarize your notes, or plan your goals. What would you like to do today?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm a simulated AI assistant for this demo. You said: "${userMessage.content}". In a fully connected version, I would analyze your LifeOS database to provide a real answer!`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}><Sparkles size={32} className="text-accent" /> AI Assistant</h1>
          <p className={styles.subtitle}>Chat with your data, get insights, and stay productive.</p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Main Chat Area */}
        <div className={styles.chatArea}>
          <div className={`glass-panel ${styles.chatContainer}`}>
            
            <div className={styles.messagesList}>
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                  >
                    <div className={styles.avatar}>
                      {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>
                    <div className={styles.messageBubble}>
                      <p>{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${styles.messageWrapper} ${styles.messageAssistant}`}
                  >
                    <div className={styles.avatar}><Bot size={18} /></div>
                    <div className={`${styles.messageBubble} ${styles.typingIndicator}`}>
                      <span></span><span></span><span></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <form onSubmit={handleSend} className={styles.inputForm}>
                <input 
                  type="text" 
                  className={styles.chatInput} 
                  placeholder="Ask me anything about your tasks, habits, or notes..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className={styles.sendBtn} disabled={!input.trim()}>
                  <Send size={18} />
                </button>
              </form>
              <p className={styles.footerText}>AI can make mistakes. Verify important information.</p>
            </div>
          </div>
        </div>

        {/* Sidebar: Suggestions */}
        <aside className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className={styles.sidebarTitle}><Zap size={18} className="text-accent" /> Suggestions</h3>
            <div className={styles.suggestionList}>
              <button className={styles.suggestionBtn} onClick={() => handleSuggestion('Summarize my journal entries from last week.')}>
                Summarize journal entries
              </button>
              <button className={styles.suggestionBtn} onClick={() => handleSuggestion('What is my current habit streak?')}>
                Check habit streaks
              </button>
              <button className={styles.suggestionBtn} onClick={() => handleSuggestion('Help me plan my goals for Q3.')}>
                Plan Q3 goals
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
            <h3 className={styles.sidebarTitle}><Command size={18} className="text-accent" /> Capabilities</h3>
            <ul className={styles.capabilitiesList}>
              <li><CheckCircle size={14} className="text-success" /> Reads your tasks & habits</li>
              <li><CheckCircle size={14} className="text-success" /> Analyzes expenses</li>
              <li><CheckCircle size={14} className="text-success" /> Drafts notes & emails</li>
              <li><History size={14} className="text-muted" /> Coming soon: Calendar sync</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
