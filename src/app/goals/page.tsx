"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, CheckCircle, Circle, Trash2, Calendar, AlertCircle } from 'lucide-react';
import styles from './page.module.css';
import { useGoals } from '@/hooks/useGoals';
import { GoalCategory } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

export default function GoalsPage() {
  const { isMounted } = useAppContext();
  const { goals, addGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone } = useGoals();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('career');
  const [deadline, setDeadline] = useState('');
  
  const [newMilestoneText, setNewMilestoneText] = useState<{ [key: string]: string }>({});

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addGoal(title, description, category, deadline || null);
      setTitle('');
      setDescription('');
      setCategory('career');
      setDeadline('');
      setIsAddModalOpen(false);
    }
  };

  const handleAddMilestone = (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newMilestoneText[goalId];
    if (text && text.trim()) {
      addMilestone(goalId, text);
      setNewMilestoneText({ ...newMilestoneText, [goalId]: '' });
    }
  };

  if (!isMounted) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Goals</h1>
          <p className={styles.subtitle}>Set, track, and achieve your big objectives.</p>
        </div>
        
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> New Goal
        </button>
      </header>

      <div className={styles.goalsGrid}>
        <AnimatePresence>
          {goals.map(goal => (
            <motion.div 
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.goalCard}
            >
              <div className={styles.goalHeader}>
                <div>
                  <div className={styles.goalMeta}>
                    <span className={styles.categoryBadge}>{goal.category}</span>
                    {goal.deadline && (
                      <span className={styles.deadlineMeta}>
                        <Calendar size={12} /> {formatDateShort(goal.deadline)}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.goalTitle}>{goal.title}</h3>
                </div>
                <button className={styles.deleteBtn} onClick={() => deleteGoal(goal.id)}>
                  <Trash2 size={16} />
                </button>
              </div>

              {goal.description && (
                <p className={styles.goalDescription}>{goal.description}</p>
              )}

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressText}>Progress</span>
                  <span className={styles.progressPercent}>{goal.progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${goal.progress}%`, background: goal.progress === 100 ? 'var(--color-success)' : 'var(--accent-primary)' }}
                  />
                </div>
              </div>

              <div className={styles.milestonesSection}>
                <h4 className={styles.milestonesTitle}>Milestones</h4>
                <div className={styles.milestoneList}>
                  {goal.milestones.map(m => (
                    <div key={m.id} className={`${styles.milestoneItem} ${m.completed ? styles.milestoneCompleted : ''}`}>
                      <button className={styles.checkBtn} onClick={() => toggleMilestone(goal.id, m.id)}>
                        {m.completed ? <CheckCircle size={16} className={styles.checkedIcon} /> : <Circle size={16} className={styles.uncheckedIcon} />}
                      </button>
                      <span className={styles.milestoneTitle}>{m.title}</span>
                      <button className={styles.deleteMilestoneBtn} onClick={() => deleteMilestone(goal.id, m.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={(e) => handleAddMilestone(goal.id, e)} className={styles.addMilestoneForm}>
                  <input 
                    type="text" 
                    className={styles.addMilestoneInput} 
                    placeholder="Add a milestone..."
                    value={newMilestoneText[goal.id] || ''}
                    onChange={(e) => setNewMilestoneText({ ...newMilestoneText, [goal.id]: e.target.value })}
                  />
                  <button type="submit" className={styles.addMilestoneBtn} disabled={!newMilestoneText[goal.id]}>
                    <Plus size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          ))}
          
          {goals.length === 0 && (
            <div className={styles.emptyState}>
              <Target size={48} className={styles.emptyIcon} />
              <p>No goals set yet. Dream big and start planning!</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Goal">
        <form onSubmit={handleAddGoal} className={styles.form}>
          <div>
            <label className="label">Goal Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Launch SaaS MVP" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className="label">Description (optional)</label>
            <textarea 
              className="input-field" 
              placeholder="What's the big picture?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Category</label>
              <select 
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
              >
                <option value="career">Career</option>
                <option value="health">Health</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="label">Deadline (optional)</label>
              <input 
                type="date" 
                className="input-field" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Create Goal
          </button>
        </form>
      </Modal>
    </main>
  );
}
