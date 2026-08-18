"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Folder, Pin, Trash2, Edit3, X, Tag } from 'lucide-react';
import styles from './page.module.css';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';

export default function NotesPage() {
  const { isMounted } = useAppContext();
  const { notes, folders, addNote, updateNote, deleteNote, togglePin } = useNotes();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolder, setEditFolder] = useState('General');
  const [editColor, setEditColor] = useState('#008080');

  if (!isMounted) return null;

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder ? n.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const openNewNote = () => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditFolder(selectedFolder || 'General');
    setEditColor('#008080');
    setIsEditorOpen(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditFolder(note.folder);
    setEditColor(note.color);
    setIsEditorOpen(true);
  };

  const handleSaveNote = () => {
    if (editingNoteId) {
      updateNote(editingNoteId, {
        title: editTitle,
        content: editContent,
        folder: editFolder,
        color: editColor
      });
    } else {
      addNote(editTitle, editContent, editFolder, editColor);
    }
    setIsEditorOpen(false);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notes</h1>
          <p className={styles.subtitle}>Capture your thoughts and ideas.</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn-primary" onClick={openNewNote}>
            <Plus size={18} /> New Note
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar for Folders */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Folders</h3>
          <ul className={styles.folderList}>
            <li 
              className={`${styles.folderItem} ${selectedFolder === null ? styles.activeFolder : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
              <Folder size={16} /> All Notes
              <span className={styles.folderCount}>{notes.length}</span>
            </li>
            {folders.map(folder => (
              <li 
                key={folder}
                className={`${styles.folderItem} ${selectedFolder === folder ? styles.activeFolder : ''}`}
                onClick={() => setSelectedFolder(folder)}
              >
                <Folder size={16} /> {folder}
                <span className={styles.folderCount}>
                  {notes.filter(n => n.folder === folder).length}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Notes Grid */}
        <div className={styles.notesGrid}>
          <AnimatePresence>
            {filteredNotes.map(note => (
              <motion.div 
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={styles.noteCard}
                onClick={() => openEditNote(note)}
                style={{ borderTop: `4px solid ${note.color}` }}
              >
                <div className={styles.noteHeader}>
                  <h3 className={styles.noteTitle}>{note.title || 'Untitled'}</h3>
                  <div className={styles.noteActions}>
                    <button 
                      className={`${styles.iconBtn} ${note.isPinned ? styles.pinned : ''}`}
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                    >
                      <Pin size={16} />
                    </button>
                    <button 
                      className={styles.iconBtn}
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className={styles.notePreview}>
                  {note.content || <span className={styles.emptyNote}>Empty note...</span>}
                </p>
                
                <div className={styles.noteFooter}>
                  <span className={styles.folderTag}>
                    <Folder size={12} /> {note.folder}
                  </span>
                  <span className={styles.noteDate}>{getRelativeTime(note.updatedAt)}</span>
                </div>
              </motion.div>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className={styles.emptyState}>
                <Edit3 size={48} className={styles.emptyIcon} />
                <p>No notes found.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className={styles.editorOverlay} onClick={() => setIsEditorOpen(false)}>
            <motion.div 
              className={styles.editorModal}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.editorHeader}>
                <div className={styles.editorMeta}>
                  <input 
                    type="text" 
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    className={styles.folderInput}
                    placeholder="Folder name"
                  />
                  <input 
                    type="color" 
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className={styles.colorPicker}
                  />
                </div>
                <div className={styles.editorActions}>
                  <button className="btn-secondary" onClick={() => setIsEditorOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveNote}>Save Note</button>
                </div>
              </div>
              
              <div className={styles.editorContent}>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.titleInput}
                  placeholder="Note Title"
                  autoFocus
                />
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={styles.contentInput}
                  placeholder="Start typing your note here... (Markdown supported eventually)"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
