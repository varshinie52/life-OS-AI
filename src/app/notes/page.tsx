'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Folder, 
  Pin, 
  Trash2, 
  Edit3, 
  Search, 
  Archive, 
  LayoutGrid, 
  List as ListIcon, 
  X, 
  Tag, 
  Clock, 
  Loader2, 
  Sparkles, 
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLifeOS } from '@/context/LifeOSContext';
import styles from './page.module.css';

interface Note {
  _id: string;
  id?: string;
  title: string;
  content?: string;
  folder: string;
  tags?: string[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FolderSummary {
  name: string;
  count: number;
}

const COLOR_PALETTE = ['#6B7F4E', '#1F3D2E', '#A2B5A0', '#DCC8A3', '#4C6A73', '#5A443A'];

const DEFAULT_FOLDERS = ['General', 'Work', 'Personal', 'Ideas', 'Research'];

export default function NotesPage() {
  const { showToast } = useToast();
  const lifeOS = useLifeOS();

  // Filters & Controls
  const [selectedFolder, setSelectedFolder] = useState('All Notes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#6B7F4E');
  const [submitting, setSubmitting] = useState(false);


  // Toggle Pin
  const handleTogglePin = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    lifeOS.togglePinNote(noteId);
    showToast('Note pin status updated', 'info');
  };

  // Toggle Archive
  const handleToggleArchive = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    showToast('Note archive status updated', 'info');
  };

  // Delete Note
  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    lifeOS.deleteNote(noteId);
    showToast('Note deleted', 'info');
  };

  // Open Modal Create
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setFolder(selectedFolder !== 'All Notes' && selectedFolder !== 'Archived' ? selectedFolder : 'General');
    setTagsInput('');
    setColor('#6B7F4E');
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (note: Note) => {
    const nId = note._id || note.id || '';
    setModalMode('edit');
    setEditingNoteId(nId);
    setTitle(note.title);
    setContent(note.content || '');
    setFolder(note.folder || 'General');
    setTagsInput(note.tags ? note.tags.join(', ') : '');
    setColor(note.color || '#6B7F4E');
    setIsModalOpen(true);
  };

  // Save Note (Create / Edit)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a note title', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        lifeOS.addNote(title.trim(), content.trim(), folder, color);
        showToast('Note created! 🎉', 'success');
      } else if (editingNoteId) {
        lifeOS.updateNote(editingNoteId, {
          title: title.trim(),
          content: content.trim(),
          folder,
          color,
        });
        showToast('Note saved!', 'success');
      }
      setIsModalOpen(false);
    } catch {
      showToast('Error saving note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedNotes = useMemo(() => {
    return lifeOS.notes.map((n) => ({
      ...n,
      _id: n.id,
      isArchived: false,
    })).filter((n) => {
      if (selectedFolder !== 'All Notes' && selectedFolder !== 'Archived' && n.folder !== selectedFolder) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q));
      }
      return true;
    });
  }, [lifeOS.notes, selectedFolder, search]);

  const folders = useMemo(() => {
    const map = new Map<string, number>();
    lifeOS.notes.forEach((n) => {
      map.set(n.folder || 'General', (map.get(n.folder || 'General') || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [lifeOS.notes]);

  const totalCount = lifeOS.notes.length;
  const archivedCount = 0;
  const loading = !lifeOS.isMounted;

  // Split Pinned vs Regular Notes
  const pinnedNotes = useMemo(() => displayedNotes.filter((n) => n.isPinned), [displayedNotes]);
  const regularNotes = useMemo(() => displayedNotes.filter((n) => !n.isPinned), [displayedNotes]);

  const renderNoteCard = (note: Note) => {
    const nId = note._id || note.id || '';
    const formattedDate = note.updatedAt
      ? new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Recently';

    return (
      <div
        key={nId}
        className={styles.noteCard}
        onClick={() => handleOpenEditModal(note)}
      >
        <div className={styles.colorIndicator} style={{ backgroundColor: note.color || '#6B7F4E' }} />

        <div className={styles.noteCardHeader}>
          <h3 className={styles.noteTitle}>{note.title}</h3>
          <div className={styles.noteActions}>
            <button
              onClick={(e) => handleTogglePin(e, nId)}
              className={`${styles.pinBtn} ${note.isPinned ? styles.pinBtnPinned : ''}`}
              title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
            >
              <Pin size={16} fill={note.isPinned ? '#f59e0b' : 'none'} />
            </button>
            <button
              onClick={(e) => handleToggleArchive(e, nId)}
              className={styles.pinBtn}
              title={note.isArchived ? 'Restore' : 'Archive'}
            >
              <Archive size={16} />
            </button>
            <button
              onClick={(e) => handleDeleteNote(e, nId)}
              className={styles.pinBtn}
              title="Delete Note"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <p className={styles.noteContentPreview}>
          {note.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty note...</span>}
        </p>

        <div className={styles.noteFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Folder size={12} />
            <span>{note.folder || 'General'}</span>
            {note.tags && note.tags.length > 0 && (
              <span className={styles.tagChip}>#{note.tags[0]}</span>
            )}
          </div>
          <span>{formattedDate}</span>
        </div>
      </div>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const activePinnedNotes = displayedNotes.filter((n) => n.isPinned);
  const activeOtherNotes = displayedNotes.filter((n) => !n.isPinned);

  const activeFoldersList = useMemo(() => {
    const map: Record<string, number> = {};
    displayedNotes.forEach((n) => {
      const f = n.folder || 'General';
      map[f] = (map[f] || 0) + 1;
    });
    return Object.entries(map).map(([folder, count]) => ({ folder, count }));
  }, [displayedNotes]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notes & Thoughts</h1>
          <p className={styles.subtitle}>Capture ideas, draft documentation, and stay organized.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              if (lifeOS.notes.length === 0) {
                showToast('No notes to delete.', 'info');
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
              opacity: lifeOS.notes.length === 0 ? 0.6 : 1,
            }}
            title="Delete All Notes"
          >
            <Trash2 size={16} /> Delete All
          </button>

          <button onClick={handleOpenCreateModal} className={styles.addBtn}>
            <Plus size={18} /> New Note
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Folders + Notes Content */}
      <div className={styles.mainGrid}>
        {/* Sidebar Folder Selector */}
        <div className={styles.sidebar}>
          <button
            onClick={() => setSelectedFolder('all')}
            className={`${styles.folderItem} ${selectedFolder === 'all' ? styles.folderItemActive : ''}`}
          >
            <div className={styles.folderLeft}>
              <Folder size={18} />
              <span>All Notes</span>
            </div>
            <span className={styles.folderCount}>{displayedNotes.length}</span>
          </button>

          <button
            onClick={() => setSelectedFolder('archived')}
            className={`${styles.folderItem} ${selectedFolder === 'archived' ? styles.folderItemActive : ''}`}
          >
            <div className={styles.folderLeft}>
              <Archive size={18} />
              <span>Archived</span>
            </div>
            <span className={styles.folderCount}>{displayedNotes.filter(n => n.isArchived).length}</span>
          </button>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.75rem 0.5rem' }}>
            Folders
          </div>

          {activeFoldersList.map((f) => (
            <button
              key={f.folder}
              onClick={() => setSelectedFolder(f.folder)}
              className={`${styles.folderItem} ${selectedFolder === f.folder ? styles.folderItemActive : ''}`}
            >
              <div className={styles.folderLeft}>
                <Folder size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>{f.folder}</span>
              </div>
              <span className={styles.folderCount}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Notes Content Section */}
        <div>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search notes & tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.selectInput}
              >
                <option value="updatedAt">Sort: Last Edited</option>
                <option value="createdAt">Sort: Created Date</option>
                <option value="title">Sort: Title (A-Z)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className={styles.spinning} size={28} style={{ margin: '0 auto 12px' }} />
              <p>Loading your notes...</p>
            </div>
          ) : displayedNotes.length > 0 ? (
            <div>
              {/* Pinned Notes Section */}
              {activePinnedNotes.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div className={styles.sectionHeading}>
                    <Pin size={16} color="#f59e0b" /> Pinned Notes ({activePinnedNotes.length})
                  </div>
                  <div className={viewMode === 'grid' ? styles.notesGrid : styles.notesList}>
                    {activePinnedNotes.map(renderNoteCard)}
                  </div>
                </div>
              )}

              {/* Regular / Other Notes Section */}
              <div>
                {activePinnedNotes.length > 0 && (
                  <div className={styles.sectionHeading}>
                    <FileText size={16} /> Other Notes ({activeOtherNotes.length})
                  </div>
                )}
                <div className={viewMode === 'grid' ? styles.notesGrid : styles.notesList}>
                  {activeOtherNotes.map(renderNoteCard)}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FileText size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>No notes found</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {search || selectedFolder !== 'All Notes'
                  ? 'Try adjusting your search query or folder selection.'
                  : 'Start capturing your thoughts by creating your first note.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <select
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {DEFAULT_FOLDERS.map((f) => (
                      <option key={f} value={f}>
                        📁 {f}
                      </option>
                    ))}
                  </select>

                  <div className={styles.swatchRow}>
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.swatch} ${color === c ? styles.swatchSelected : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.editorTitleInput}
                  required
                  autoFocus
                />

                <textarea
                  placeholder="Start typing your note... (Markdown supported)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={styles.editorTextarea}
                />

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. project, idea, reference"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
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
                      padding: '0.65rem 1.5rem',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {submitting ? <Loader2 className={styles.spinning} size={18} /> : <><Save size={16} /> Save Note</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete All Notes Modal */}
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
                  Delete all notes?
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  This will permanently remove all notes from this LifeOS account. Habits, tasks, journal entries, and calendar events will remain untouched.
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
                    lifeOS.clearSectionData('notes');
                    setIsDeleteAllModalOpen(false);
                    showToast('All notes deleted', 'info');
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
