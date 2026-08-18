"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Clock, Trash2, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import styles from './page.module.css';
import { useCalendar } from '@/hooks/useCalendar';
import { getToday, getDaysInMonth, getFirstDayOfMonth, MONTH_NAMES, formatTime12h, DAY_NAMES } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

export default function CalendarPage() {
  const { isMounted } = useAppContext();
  const { events, addEvent, deleteEvent, getEventsByDate } = useCalendar();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getToday());
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState('#008080');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addEvent(title, description, date, startTime, endTime, color);
      setTitle('');
      setDescription('');
      setIsAddModalOpen(false);
    }
  };

  if (!isMounted) return null;

  const todayStr = getToday();
  const selectedEvents = getEventsByDate(selectedDate);

  // Padding days before the 1st
  const paddingDays = Array.from({ length: firstDay }).map((_, i) => `padding-${i}`);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>Plan your time effectively.</p>
        </div>
        
        <button 
          className="btn-primary" 
          onClick={() => {
            setDate(selectedDate);
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} /> New Event
        </button>
      </header>

      <div className={styles.layout}>
        {/* Main Calendar View */}
        <div className={styles.calendarArea}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            
            <div className={styles.monthHeader}>
              <h2 className={styles.monthTitle}>{MONTH_NAMES[month]} {year}</h2>
              <div className={styles.monthControls}>
                <button className={styles.iconBtn} onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <button className="btn-secondary" onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(getToday());
                }} style={{ padding: '4px 12px', fontSize: '0.85rem' }}>Today</button>
                <button className={styles.iconBtn} onClick={handleNextMonth}><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className={styles.calendarGrid}>
              {DAY_NAMES.map(day => (
                <div key={day} className={styles.dayName}>{day}</div>
              ))}
              
              {paddingDays.map(id => (
                <div key={id} className={styles.paddingDay}></div>
              ))}

              {daysInMonth.map(dateStr => {
                const d = new Date(dateStr + 'T00:00:00');
                const dayNum = d.getDate();
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvents = getEventsByDate(dateStr);
                
                return (
                  <div 
                    key={dateStr}
                    className={`${styles.calendarDay} ${isSelected ? styles.selectedDay : ''} ${isToday ? styles.todayDay : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className={styles.dayNumWrapper}>
                      <span className={styles.dayNumText}>{dayNum}</span>
                    </div>
                    
                    <div className={styles.eventDots}>
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e.id} className={styles.eventDot} style={{ backgroundColor: e.color }} title={e.title}></div>
                      ))}
                      {dayEvents.length > 3 && <div className={styles.moreEvents}>+{dayEvents.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Day Details */}
        <aside className={styles.sidebar}>
          <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
            <h3 className={styles.sidebarTitle}>
              {selectedDate === todayStr ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            
            <div className={styles.eventList}>
              <AnimatePresence mode="popLayout">
                {selectedEvents.map(event => (
                  <motion.div 
                    key={event.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={styles.eventCard}
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className={styles.eventCardHeader}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      <button className={styles.deleteBtn} onClick={() => deleteEvent(event.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className={styles.eventMeta}>
                      <Clock size={12} /> {formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}
                    </div>
                    
                    {event.description && (
                      <div className={styles.eventDesc}>
                        <AlignLeft size={12} /> {event.description}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {selectedEvents.length === 0 && (
                <div className={styles.emptyState}>
                  <CalendarIcon size={32} className={styles.emptyIcon} />
                  <p>No events scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Event">
        <form onSubmit={handleAddEvent} className={styles.form}>
          <div>
            <label className="label">Event Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Team Standup" 
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
              placeholder="Add details..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Color</label>
              <input 
                type="color" 
                className={styles.colorPicker} 
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className="label">Start Time</label>
              <input 
                type="time" 
                className="input-field" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">End Time</label>
              <input 
                type="time" 
                className="input-field" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Save Event
          </button>
        </form>
      </Modal>

    </main>
  );
}
