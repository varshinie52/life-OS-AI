'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Camera, 
  Save, 
  RotateCcw, 
  Loader2, 
  Calendar, 
  Sparkles,
  Globe,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, authFetch, updateUserLocally } = useAuth();
  const { showToast } = useToast();

  const activeUser = user || {
    _id: 'default_user',
    name: 'LifeOS User',
    username: 'lifeos_user',
    email: '',
    bio: 'Building better habits, one day at a time.',
    isEmailVerified: true,
    role: 'user',
    createdAt: new Date().toISOString(),
    avatar: {},
    preferences: { theme: 'dark', language: 'en', timezone: 'UTC' }
  };

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(activeUser.name || 'LifeOS User');
    setUsername(activeUser.username || 'user');
    setBio(activeUser.bio || '');
  }, [user]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || undefined,
          bio: bio.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        updateUserLocally({
          name: data.data.user.name,
          username: data.data.user.username,
          bio: data.data.user.bio,
        });
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const response = await authFetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        updateUserLocally({ avatar: data.data.user.avatar });
        showToast('Avatar updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to upload avatar', 'error');
      }
    } catch (err) {
      showToast('Error uploading avatar', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const response = await authFetch(`${API_URL}/users/avatar`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok && data.success) {
        updateUserLocally({ avatar: undefined });
        showToast('Avatar removed', 'info');
      } else {
        showToast(data.message || 'Failed to remove avatar', 'error');
      }
    } catch (err) {
      showToast('Error removing avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReset = () => {
    setName(activeUser.name || 'Varsh Demo');
    setUsername(activeUser.username || 'varshdemo');
    setBio(activeUser.bio || 'Building better habits, one day at a time.');
  };

  const userInitial = activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'V';
  const joinedDate = activeUser.createdAt 
    ? new Date(activeUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const avatarUrl = typeof activeUser.avatar === 'string' ? activeUser.avatar : activeUser.avatar?.url;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cover Banner */}
      <div className={styles.coverBanner}>
        <div className={styles.coverGlow} />
      </div>

      {/* Profile Identity Block */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={activeUser.name} className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarFallback}>{userInitial}</div>
          )}
          
          <label className={styles.avatarOverlay} title="Upload new photo">
            {uploadingAvatar ? (
              <Loader2 className={styles.spinning} size={20} />
            ) : (
              <>
                <Camera size={18} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Change</span>
              </>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className={styles.avatarInput} 
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.nameBadgesRow}>
            <h1 className={styles.fullName}>{activeUser.name}</h1>
            
            <div className={styles.badgesGroup}>
              {activeUser.isEmailVerified ? (
                <span className={`${styles.badge} ${styles.verifiedBadge}`}>
                  <ShieldCheck size={14} /> Verified
                </span>
              ) : (
                <span className={`${styles.badge} ${styles.unverifiedBadge}`}>
                  <ShieldAlert size={14} /> Pending Verification
                </span>
              )}

              {activeUser.role && (
                <span className={`${styles.badge} ${styles.roleBadge}`}>
                  <Sparkles size={12} /> {activeUser.role}
                </span>
              )}
            </div>
          </div>
          
          <div className={styles.username}>
            {activeUser.username ? `@${activeUser.username}` : activeUser.email}
          </div>

          {activeUser.bio && <p className={styles.bioText}>{activeUser.bio}</p>}

          {avatarUrl && (
            <button 
              onClick={handleRemoveAvatar} 
              className={styles.avatarRemoveBtn}
              disabled={uploadingAvatar}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Edit Profile Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <UserIcon size={18} color="var(--accent-primary)" /> Edit Profile
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrapper}>
                <UserIcon size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Username</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>@</span>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                  placeholder="username"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value.slice(0, 200))} 
                placeholder="Tell us a little bit about yourself..."
                className={styles.textarea}
              />
              <span className={styles.charCount}>{bio.length}/200</span>
            </div>

            <div className={styles.buttonRow}>
              <button 
                type="button" 
                onClick={handleReset} 
                className={styles.resetBtn}
                disabled={loading}
              >
                <RotateCcw size={15} /> Reset
              </button>
              
              <button 
                type="submit" 
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className={styles.spinning} size={16} />
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Quick Details Sidebar */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <ShieldCheck size={18} color="var(--accent-primary)" /> Account Details
              </h2>
            </div>

            <div className={styles.statList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  <Mail size={15} /> Email
                </span>
                <span className={styles.statValue} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {activeUser.email}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  <Calendar size={15} /> Member Since
                </span>
                <span className={styles.statValue}>{joinedDate}</span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  <Globe size={15} /> Timezone
                </span>
                <span className={styles.statValue}>
                  {activeUser.preferences?.timezone || 'Asia/Kolkata'}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>
                  <Clock size={15} /> Language
                </span>
                <span className={styles.statValue}>
                  {activeUser.preferences?.language?.toUpperCase() || 'EN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
