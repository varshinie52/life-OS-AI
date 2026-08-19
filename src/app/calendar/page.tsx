'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Tag, 
  CheckSquare, 
  Target, 
  BookOpen, 
  Trash2, 
  MapPin, 
  X, 
  Loader2, 
  Search,
  Filter,
  Check,
  CalendarDays,
  LayoutList,
  Eye
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import { safeFormatDate, formatTime12h, getToday } from '@/lib/utils';
import styles from './page.module.css';

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: 'event' | 'task' | 'habit' | 'journal';
  color: string;
  location?: string;
  status?: string;
  rawId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getToday());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Module filter options
  const [showTasks, setShowTasks] = useState(true);
  const [showHabits, setShowHabits] = useState(true);
  const [showJournal, setShowJournal] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Add event modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(selectedDateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [eventColor, setEventColor] = useState('#4C6A73');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Details Modal for clicked item
  const [activeItemDetails, setActiveItemDetails] = useState<CalendarItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Unified dynamic calendar aggregation from LifeOSContext
  const allCalendarItems = useMemo(() => {
    const items: CalendarItem[] = [];

    if (showEvents) {
      lifeOS.events.forEach((e) => {
        items.push({
          id: e.id,
          rawId: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          startTime: e.startTime || '09:00',
          endTime: e.endTime || '10:00',
          type: 'event',
          color: e.color || '#4C6A73',
          location: (e as any).location || '',
        });
      });
    }

    if (showTasks) {
      lifeOS.tasks.forEach((t) => {
        if (t.dueDate) {
          const dStr = t.dueDate.split('T')[0];
          items.push({
            id: `t-${t.id}`,
            rawId: t.id,
            title: t.title,
            description: t.description || `Priority: ${t.priority.toUpperCase()}`,
            date: dStr,
            startTime: '09:00',
            type: 'task',
            color: t.status === 'done' ? '#6B7F4E' : '#DCC8A3',
            status: t.status,
          });
        }
      });
    }

    if (showHabits) {
      lifeOS.habits.forEach((h) => {
        h.completedDates.forEach((dStr) => {
          items.push({
            id: `h-${h.id}-${dStr}`,
            rawId: h.id,
            title: h.name,
            description: `Logged habit completion 🔥`,
            date: dStr,
            startTime: '08:00',
            type: 'habit',
            color: h.color || '#6B7F4E',
          });
        });
      });
    }

    if (showJournal) {
      lifeOS.journal.forEach((j) => {
        if (j.date) {
          items.push({
            id: `j-${j.id}`,
            rawId: j.id,
            title: `Journal (${j.mood})`,
            description: j.content,
            date: j.date,
            startTime: '20:00',
            type: 'journal',
            color: '#A2B5A0',
          });
        }
      });
    }

    // Apply Search Filter if typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return items.filter(
        (it) => it.title.toLowerCase().includes(q) || (it.description && it.description.toLowerCase().includes(q))
      );
    }

    return items;
  }, [lifeOS.events, lifeOS.tasks, lifeOS.habits, lifeOS.journal, showEvents, showTasks, showHabits, showJournal, searchQuery]);

  // Group by Date for fast lookups
  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    allCalendarItems.forEach((it) => {
      if (!map[it.date]) map[it.date] = [];
      map[it.date].push(it);
    });
    return map;
  }, [allCalendarItems]);

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() - 7);
      setCurrentDate(nextD);
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() - 1);
      setCurrentDate(nextD);
      setSelectedDateStr(nextD.toISOString().split('T')[0]);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() + 7);
      setCurrentDate(nextD);
    } else {
      const nextD = new Date(currentDate);
      nextD.setDate(nextD.getDate() + 1);
      setCurrentDate(nextD);
      setSelectedDateStr(nextD.toISOString().split('T')[0]);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getToday());
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      showToast('Please enter an event title', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      lifeOS.addCalendarEvent(
        eventTitle.trim(),
        eventDesc.trim(),
        eventDate,
        startTime,
        endTime,
        eventColor
      );
      showToast('Event created successfully! 📅', 'success');
      setIsModalOpen(false);
      setEventTitle('');
      setEventDesc('');
    } catch {
      showToast('Error creating event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (itemId: string, rawId?: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    if (rawId) lifeOS.deleteCalendarEvent(rawId);
    else lifeOS.deleteCalendarEvent(itemId);
    setActiveItemDetails(null);
    showToast('Event deleted', 'info');
  };

  // Month grid days
  const { gridDays, paddingBefore } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(Date.UTC(year, month, day));
      days.push(d.toISOString().split('T')[0]);
    }
    return { gridDays: days, paddingBefore: firstDayIndex };
  }, [year, month]);

  // Week days grid
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [currentDate]);

  const todayStr = getToday();
  const selectedDayItems = itemsByDate[selectedDateStr] || [];

  const getItemIcon = (type: CalendarItem['type']) => {
    switch (type) {
      case 'task': return <CheckSquare size={12} />;
      case 'habit': return <Target size={12} />;
      case 'journal': return <BookOpen size={12} />;
      default: return <Clock size={12} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Google Calendar-Style Top Navigation Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 className={styles.title}>Unified Calendar</h1>
          <button onClick={handleJumpToday} className={styles.todayBtn}>
            Today
          </button>
          <div className={styles.monthNavBtns}>
            <button onClick={handlePrev} className={styles.navBtn} title="Previous">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} className={styles.navBtn} title="Next">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className={styles.monthTitle}>
            {MONTH_NAMES[month]} {year}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Filter Box */}
          <div className={styles.searchBox}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search schedule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          {/* Views Selector Tabs */}
          <div className={styles.viewSelector}>
            <button
              className={viewMode === 'month' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={viewMode === 'week' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={viewMode === 'day' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={viewMode === 'agenda' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('agenda')}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => {
              if (lifeOS.events.length === 0) {
                showToast('No calendar events to delete.', 'info');
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
              opacity: lifeOS.events.length === 0 ? 0.6 : 1,
            }}
            title="Delete All Calendar Events"
          >
            <Trash2 size={16} /> Delete All
          </button>

          {/* New Event Button */}
          <button
            onClick={() => {
              setEventDate(selectedDateStr);
              setIsModalOpen(true);
            }}
            className={styles.addBtn}
          >
            <Plus size={18} /> New Event
          </button>
        </div>
      </div>

      {/* Toolbar: Module Legend Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            <Filter size={14} /> Filter Modules:
          </span>

          <label className={styles.checkboxLabel} style={{ color: '#DCC8A3' }}>
            <input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} />
            <CheckSquare size={14} /> Tasks
          </label>

          <label className={styles.checkboxLabel} style={{ color: '#6B7F4E' }}>
            <input type="checkbox" checked={showHabits} onChange={(e) => setShowHabits(e.target.checked)} />
            <Target size={14} /> Habits
          </label>

          <label className={styles.checkboxLabel} style={{ color: '#A2B5A0' }}>
            <input type="checkbox" checked={showJournal} onChange={(e) => setShowJournal(e.target.checked)} />
            <BookOpen size={14} /> Journal
          </label>

          <label className={styles.checkboxLabel} style={{ color: '#4C6A73' }}>
            <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} />
            <CalendarIcon size={14} /> Manual Events
          </label>
        </div>
      </div>

      {/* Main Calendar View Area */}
      <div className={styles.layoutGrid}>
        {/* Month View */}
        {viewMode === 'month' && (
          <div className={styles.calendarCard}>
            <div className={styles.daysHeader}>
              {DAY_NAMES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {Array.from({ length: paddingBefore }).map((_, i) => (
                <div key={`pad-${i}`} className={`${styles.cell} ${styles.cellPadding}`} />
              ))}

              {gridDays.map((dateStr) => {
                const dayNum = parseInt(dateStr.split('-')[2]);
                const dayItems = itemsByDate[dateStr] || [];
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`${styles.cell} ${isSelected ? styles.cellSelected : ''} ${isToday ? styles.cellToday : ''}`}
                  >
                    <div className={styles.dateNumber}>{dayNum}</div>

                    <div className={styles.eventChips}>
                      {dayItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={styles.eventChip}
                          style={{ backgroundColor: item.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItemDetails(item);
                          }}
                          title={item.title}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '3px' }}>
                            {getItemIcon(item.type)}
                          </span>
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className={styles.moreCount}>
                          +{dayItems.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className={styles.calendarCard} style={{ overflowX: 'auto' }}>
            <div className={styles.daysHeader} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {weekDays.map((dStr) => (
                <div key={dStr} style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {safeFormatDate(dStr, 'No date', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: dStr === todayStr ? '#6B7F4E' : 'var(--text-primary)' }}>
                    {dStr.split('-')[2]}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-subtle)', minHeight: '400px' }}>
              {weekDays.map((dStr) => {
                const dayItems = itemsByDate[dStr] || [];
                return (
                  <div
                    key={dStr}
                    style={{
                      background: dStr === selectedDateStr ? 'rgba(107, 127, 78, 0.08)' : 'var(--surface-card)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedDateStr(dStr)}
                  >
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={styles.eventChip}
                        style={{ backgroundColor: item.color, padding: '4px 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItemDetails(item);
                        }}
                      >
                        <span style={{ marginRight: '4px' }}>{getItemIcon(item.type)}</span>
                        {item.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className={styles.calendarCard}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '1.1rem' }}>
              {safeFormatDate(selectedDateStr, 'No date', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDayItems.length > 0 ? (
                selectedDayItems.map((item) => (
                  <div
                    key={item.id}
                    className={styles.agendaItem}
                    style={{ borderLeftColor: item.color }}
                    onClick={() => setActiveItemDetails(item)}
                  >
                    <div className={styles.agendaItemHeader}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.badgeType} style={{ backgroundColor: `${item.color}25`, color: item.color }}>
                        {item.type}
                      </span>
                    </div>
                    {item.description && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.description}</p>}
                    <div className={styles.itemMeta} style={{ marginTop: '8px' }}>
                      <Clock size={14} /> {formatTime12h(item.startTime)}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No events scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agenda View */}
        {viewMode === 'agenda' && (
          <div className={styles.calendarCard} style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Upcoming LifeOS Agenda</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {allCalendarItems.length > 0 ? (
                allCalendarItems.slice(0, 15).map((item) => (
                  <div
                    key={item.id}
                    className={styles.agendaItem}
                    style={{ borderLeftColor: item.color }}
                    onClick={() => setActiveItemDetails(item)}
                  >
                    <div className={styles.agendaItemHeader}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {safeFormatDate(item.date)}
                      </span>
                    </div>
                    <div className={styles.itemMeta} style={{ marginTop: '6px' }}>
                      <Clock size={13} /> {formatTime12h(item.startTime)}
                      <span className={styles.badgeType} style={{ backgroundColor: `${item.color}25`, color: item.color, marginLeft: 'auto' }}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>No upcoming agenda items found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Agenda List */}
        <div className={styles.sidebar}>
          <div className={styles.agendaCard}>
            <div className={styles.agendaTitle}>
              {selectedDateStr === todayStr ? "Today's Agenda" : safeFormatDate(selectedDateStr, 'No date', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            <div className={styles.agendaList}>
              {selectedDayItems.length > 0 ? (
                selectedDayItems.map((item) => (
                  <div
                    key={item.id}
                    className={styles.agendaItem}
                    style={{ borderLeftColor: item.color }}
                    onClick={() => setActiveItemDetails(item)}
                  >
                    <div className={styles.agendaItemHeader}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.badgeType} style={{ backgroundColor: `${item.color}25`, color: item.color }}>
                        {item.type}
                      </span>
                    </div>

                    {item.description && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.description}
                      </p>
                    )}

                    <div className={styles.itemMeta}>
                      <Clock size={12} />
                      {formatTime12h(item.startTime)}
                      {item.type === 'event' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(item.id, item.rawId);
                          }}
                          className={styles.deleteIconBtn}
                          title="Delete Event"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <CalendarIcon size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No items scheduled for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      <AnimatePresence>
        {activeItemDetails && (
          <motion.div className={styles.modalBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={styles.badgeType} style={{ backgroundColor: `${activeItemDetails.color}25`, color: activeItemDetails.color, fontSize: '0.85rem' }}>
                  {activeItemDetails.type.toUpperCase()}
                </span>
                <button onClick={() => setActiveItemDetails(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>{activeItemDetails.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <span>📅 {safeFormatDate(activeItemDetails.date)}</span>
                <span>⏰ {formatTime12h(activeItemDetails.startTime)}</span>
              </div>

              {activeItemDetails.description && (
                <div style={{ background: 'var(--surface-solid)', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  {activeItemDetails.description}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {activeItemDetails.type === 'event' && (
                  <button
                    onClick={() => handleDeleteEvent(activeItemDetails.id, activeItemDetails.rawId)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Delete Event
                  </button>
                )}
                <button
                  onClick={() => setActiveItemDetails(null)}
                  style={{ background: 'var(--surface-solid)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className={styles.modalBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Add Custom Event</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Design Review Sync"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
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

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Meeting agenda, links, notes..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minHeight: '70px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
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
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      Color
                    </label>
                    <select
                      value={eventColor}
                      onChange={(e) => setEventColor(e.target.value)}
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
                      <option value="#6B7F4E">Moss Green 🌿</option>
                      <option value="#1F3D2E">Forest Shade 🌲</option>
                      <option value="#A2B5A0">Sage Mist 🍃</option>
                      <option value="#DCC8A3">Sand Beige ⏳</option>
                      <option value="#4C6A73">River Blue 🌊</option>
                      <option value="#5A443A">Earth Brown 🪵</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
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
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    disabled={submitting}
                    style={{
                      background: 'var(--moss)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {submitting ? <Loader2 className={styles.spinning} size={18} /> : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete All Calendar Events Modal */}
      <AnimatePresence>
        {isDeleteAllModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              style={{ maxWidth: '440px', padding: '1.75rem' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(184, 91, 73, 0.15)', color: '#B85B49', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Trash2 size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Delete all calendar events?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  This will permanently remove all manual calendar events from this LifeOS account. Habits, tasks, notes, and journal entries will remain untouched.
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
                    lifeOS.clearSectionData('events');
                    setIsDeleteAllModalOpen(false);
                    showToast('All calendar events deleted', 'info');
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
