'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  List as ListIcon, 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  Trash2, 
  Archive, 
  Edit3, 
  CheckSquare, 
  X,
  Zap,
  Timer,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import { Task } from '@/lib/types';
import { safeFormatDate } from '@/lib/utils';
import styles from './page.module.css';

const FILTER_TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

const CATEGORIES = ['all', 'work', 'personal', 'health', 'finance', 'education', 'study', 'other'];

export default function TasksPage() {
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const summaryMetrics = useMemo(() => {
    return {
      total: lifeOS.metrics.tasksTotal,
      completed: lifeOS.metrics.tasksCompleted,
      overdue: lifeOS.metrics.tasksOverdue,
      urgentAndHigh: lifeOS.tasks.filter((t) => t.priority === 'high').length,
    };
  }, [lifeOS.metrics, lifeOS.tasks]);

  const filteredTasks = useMemo(() => {
    return lifeOS.tasks
      .filter((task) => {
        if (activeTab === 'today') {
          return task.dueDate === todayStr;
        }
        if (activeTab === 'upcoming') {
          return task.status !== 'done' && task.dueDate && task.dueDate > todayStr;
        }
        if (activeTab === 'overdue') {
          return task.status !== 'done' && task.dueDate && task.dueDate < todayStr;
        }
        if (activeTab === 'completed') return task.status === 'done';
        return true;
      })
      .filter((task) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
          task.title.toLowerCase().includes(q) ||
          (task.description && task.description.toLowerCase().includes(q))
        );
      })
      .filter((task) => {
        if (selectedCategory === 'all') return true;
        return (task.category || 'work').toLowerCase() === selectedCategory.toLowerCase();
      })
      .filter((task) => {
        if (selectedPriority === 'all') return true;
        return (task.priority || 'medium').toLowerCase() === selectedPriority.toLowerCase();
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return da - db;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return b.id.localeCompare(a.id);
      });
  }, [lifeOS.tasks, activeTab, search, selectedCategory, selectedPriority, sortBy, todayStr]);

  const handleToggleComplete = (taskId: string) => {
    lifeOS.toggleTaskStatus(taskId);
    showToast('Task status updated! 🎉', 'success');
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setCategory('work');
    setDueDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setModalMode('edit');
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setCategory(task.category || 'work');
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title', 'warning');
      return;
    }

    if (modalMode === 'create') {
      lifeOS.addTask(title.trim(), description.trim(), priority, category, dueDate || todayStr);
      showToast('Task created! 🎉', 'success');
    } else if (editingTaskId) {
      lifeOS.updateTask(editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category,
        dueDate: dueDate || null,
      });
      showToast('Task updated!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    lifeOS.deleteTask(taskId);
    showToast('Task deleted', 'info');
  };

  const todoColumn = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressColumn = filteredTasks.filter((t) => t.status === 'in-progress');
  const doneColumn = filteredTasks.filter((t) => t.status === 'done');

  const getPriorityBadgeClass = (p: string) => {
    if (p === 'high') return styles.badgeHigh;
    if (p === 'medium') return styles.badgeMedium;
    return styles.badgeLow;
  };

  const renderTaskCard = (task: Task) => {
    const isDone = task.status === 'done';
    const isOverdue = !isDone && task.dueDate && task.dueDate < todayStr;
    const isToday = task.dueDate === todayStr;

    return (
      <div key={task.id} className={`${styles.taskCard} ${isDone ? styles.taskCardDone : ''}`}>
        <div className={styles.leftSection}>
          <button onClick={() => handleToggleComplete(task.id)} className={styles.checkBtn}>
            {isDone ? (
              <CheckCircle2 size={22} color="var(--moss)" />
            ) : (
              <Circle size={22} />
            )}
          </button>

          <div>
            <h3 className={styles.taskTitle}>{task.title}</h3>
            {task.description && <p className={styles.taskDesc}>{task.description}</p>}

            <div className={styles.metaRow}>
              <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`${styles.badge} ${styles.badgeCategory}`}>
                {task.category || 'work'}
              </span>

              {task.dueDate && (
                <span className={`${styles.metaItem} ${isOverdue ? styles.overdueText : isToday ? styles.todayText : ''}`}>
                  <CalendarIcon size={13} />
                  {isOverdue ? 'Overdue: ' : isToday ? 'Today: ' : ''}
                  {safeFormatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <button onClick={() => handleOpenEditModal(task)} className={styles.actionBtn} title="Edit Task">
            <Edit3 size={16} />
          </button>
          <button onClick={() => handleDeleteTask(task.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Task">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Task Manager</h1>
          <p className={styles.subtitle}>Organize your priorities, streamline workflows, and stay on top of deadlines.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'kanban' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              if (lifeOS.tasks.length === 0) {
                showToast('No tasks to delete.', 'info');
              } else {
                setIsDeleteAllModalOpen(true);
              }
            }}
            style={{
              background: 'rgba(184, 91, 73, 0.1)',
              color: '#B85B49',
              border: '1px solid rgba(184, 91, 73, 0.3)',
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              opacity: lifeOS.tasks.length === 0 ? 0.6 : 1,
            }}
            title="Delete All Tasks"
          >
            <Trash2 size={16} /> Delete All
          </button>

          <button onClick={handleOpenCreateModal} className={styles.addBtn}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Metric Header Cards */}
      <div className={styles.analyticsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(76, 106, 115, 0.15)', color: '#4C6A73' }}>
            <CheckSquare size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summaryMetrics.total}</div>
            <div className={styles.statLabel}>Total Tasks</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(107, 127, 78, 0.15)', color: '#6B7F4E' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summaryMetrics.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(184, 91, 73, 0.15)', color: '#B85B49' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#B85B49' }}>
              {summaryMetrics.overdue}
            </div>
            <div className={styles.statLabel}>Overdue Tasks</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(220, 200, 163, 0.25)', color: '#DCC8A3' }}>
            <Zap size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{summaryMetrics.urgentAndHigh}</div>
            <div className={styles.statLabel}>High Priority</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Filter Tabs, Category/Priority Filters, Search & Sort */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.selectInput}
          >
            <option value="all">Category: All</option>
            {CATEGORIES.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={styles.selectInput}
          >
            <option value="all">Priority: All</option>
            <option value="high">High 🟠</option>
            <option value="medium">Medium 🟡</option>
            <option value="low">Low 🔵</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.selectInput}
          >
            <option value="createdAt">Sort: Created Date</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main View: List View vs Kanban Board View */}
      {viewMode === 'list' ? (
        <div className={styles.listContainer}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(renderTaskCard)
          ) : (
            <div className={styles.emptyState}>
              <CheckSquare size={44} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>No tasks found</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                You have no tasks matching the selected filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.kanbanGrid}>
          {/* To Do Column */}
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4C6A73' }} />
                To Do
              </div>
              <span className={styles.columnCount}>{todoColumn.length}</span>
            </div>
            {todoColumn.length > 0 ? todoColumn.map(renderTaskCard) : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No tasks</p>}
          </div>

          {/* In Progress Column */}
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DCC8A3' }} />
                In Progress
              </div>
              <span className={styles.columnCount}>{inProgressColumn.length}</span>
            </div>
            {inProgressColumn.length > 0 ? inProgressColumn.map(renderTaskCard) : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No tasks</p>}
          </div>

          {/* Done Column */}
          <div className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <div className={styles.columnTitle}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7F4E' }} />
                Done
              </div>
              <span className={styles.columnCount}>{doneColumn.length}</span>
            </div>
            {doneColumn.length > 0 ? doneColumn.map(renderTaskCard) : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No tasks</p>}
          </div>
        </div>
      )}

      {/* Task Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
            <motion.div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {modalMode === 'create' ? 'Create New Task' : 'Edit Task'}
                </h2>
                <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTask}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Task Title *</label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    placeholder="Add details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minHeight: '80px',
                    }}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-solid)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-solid)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'var(--moss)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete All Tasks Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsDeleteAllModalOpen(false)}>
            <motion.div
              className={styles.modalContent}
              style={{ maxWidth: '440px', padding: '1.75rem' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(184, 91, 73, 0.15)', color: '#B85B49', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Trash2 size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Delete all tasks?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  This will permanently remove all tasks from this LifeOS account. Habits, notes, journal entries, and calendar events will remain untouched.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lifeOS.clearSectionData('tasks');
                    setIsDeleteAllModalOpen(false);
                    showToast('All tasks deleted', 'info');
                  }}
                  style={{
                    flex: 1,
                    background: '#B85B49',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
