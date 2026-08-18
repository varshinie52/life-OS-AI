"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, Clock, LayoutGrid, List as ListIcon, Calendar as CalendarIcon, Tag, MoreVertical, Trash2 } from 'lucide-react';
import styles from './page.module.css';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskPriority } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

export default function TasksPage() {
  const { isMounted } = useAppContext();
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(title, description, priority, category, dueDate || null);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('Work');
      setDueDate('');
      setIsAddModalOpen(false);
    }
  };

  if (!isMounted) return null;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const renderTaskCard = (task: Task) => (
    <motion.div 
      key={task.id} 
      className={`${styles.taskCard} ${task.status === 'done' ? styles.taskDone : ''}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className={styles.taskHeader}>
        <div className={styles.taskTitleRow}>
          <button 
            className={styles.checkBtn} 
            onClick={() => toggleTaskStatus(task.id)}
          >
            {task.status === 'done' ? (
              <CheckCircle size={20} className={styles.checkedIcon} />
            ) : (
              <Circle size={20} className={styles.uncheckedIcon} />
            )}
          </button>
          <span className={styles.taskTitle}>{task.title}</span>
        </div>
        <div className={styles.taskActions}>
          <span className={`${styles.badge} ${styles[`badge${task.priority}`]}`}>
            {task.priority}
          </span>
          <button className={styles.iconBtn} onClick={() => deleteTask(task.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className={styles.taskDescription}>{task.description}</p>
      )}
      
      <div className={styles.taskFooter}>
        <span className={styles.taskMeta}>
          <Tag size={14} /> {task.category}
        </span>
        {task.dueDate && (
          <span className={`${styles.taskMeta} ${task.dueDate < new Date().toISOString().split('T')[0] && task.status !== 'done' ? styles.overdue : ''}`}>
            <CalendarIcon size={14} /> {formatDateShort(task.dueDate)}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>Manage your priorities and stay organized.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon size={18} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'kanban' ? styles.active : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> New Task
          </button>
        </div>
      </header>

      {viewMode === 'list' ? (
        <div className={styles.listView}>
          <div className={styles.listSection}>
            <h3 className={styles.sectionTitle}>To Do ({todoTasks.length})</h3>
            <AnimatePresence>
              {todoTasks.map(renderTaskCard)}
            </AnimatePresence>
          </div>
          
          {inProgressTasks.length > 0 && (
            <div className={styles.listSection}>
              <h3 className={styles.sectionTitle}>In Progress ({inProgressTasks.length})</h3>
              <AnimatePresence>
                {inProgressTasks.map(renderTaskCard)}
              </AnimatePresence>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className={styles.listSection}>
              <h3 className={styles.sectionTitle}>Completed ({doneTasks.length})</h3>
              <AnimatePresence>
                {doneTasks.map(renderTaskCard)}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.kanbanBoard}>
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span className={styles.dot} style={{ background: 'var(--text-muted)' }}></span>
                To Do
              </div>
              <span className={styles.taskCount}>{todoTasks.length}</span>
            </div>
            <div className={styles.columnContent}>
              <AnimatePresence>
                {todoTasks.map(renderTaskCard)}
              </AnimatePresence>
            </div>
          </div>
          
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span className={styles.dot} style={{ background: 'var(--color-warning)' }}></span>
                In Progress
              </div>
              <span className={styles.taskCount}>{inProgressTasks.length}</span>
            </div>
            <div className={styles.columnContent}>
              <AnimatePresence>
                {inProgressTasks.map(renderTaskCard)}
              </AnimatePresence>
            </div>
          </div>
          
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span className={styles.dot} style={{ background: 'var(--color-success)' }}></span>
                Done
              </div>
              <span className={styles.taskCount}>{doneTasks.length}</span>
            </div>
            <div className={styles.columnContent}>
              <AnimatePresence>
                {doneTasks.map(renderTaskCard)}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Task">
        <form onSubmit={handleAddTask} className={styles.form}>
          <div>
            <label className="label">Task Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="What needs to be done?" 
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
              placeholder="Add more details..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Priority</label>
              <select 
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="label">Category</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Work, Personal"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Due Date (optional)</label>
            <input 
              type="date" 
              className="input-field" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Create Task
          </button>
        </form>
      </Modal>

    </main>
  );
}
