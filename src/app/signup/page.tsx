'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';

export default function SignupPage() {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    
    try {
      const generatedUsername = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        username: generatedUsername,
      });
      
      if (result.success) {
        setSuccess(true);
      } else {
        showToast(result.message || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, damping: 25, stiffness: 300, staggerChildren: 0.08, delayChildren: 0.1 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300 } }
  };

  return (
    <motion.div 
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className={styles.backgroundDecoration} />
      
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div 
            key="form"
            className={styles.card}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className={styles.header} variants={itemVariants}>
              <div className={styles.logoContainer}>
                <div className={styles.logoBox}>
                  <Check size={24} strokeWidth={3} />
                </div>
                <h1 className={styles.logoText}>LifeOS</h1>
              </div>
              <h2 className={styles.title}>Create Account</h2>
              <p className={styles.subtitle}>Start your productivity journey</p>
            </motion.div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Field 1: Name */}
              <motion.div className={styles.inputGroup} variants={itemVariants}>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={20} />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </motion.div>

              {/* Field 2: Email */}
              <motion.div className={styles.inputGroup} variants={itemVariants}>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </motion.div>

              {/* Field 3: Password */}
              <motion.div className={styles.inputGroup} variants={itemVariants}>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </motion.div>

              <motion.button 
                type="submit" 
                className={styles.submitBtn}
                disabled={loading}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <Loader2 className={styles.spinning} size={20} />
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            <motion.div className={styles.footer} variants={itemVariants}>
              Already have an account? <Link href="/login" className={styles.link}>Login</Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            className={styles.card}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } }}
          >
            <div className={styles.successContainer}>
              <motion.div 
                className={styles.successIconWrapper}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Check size={40} />
              </motion.div>
              
              <h2 className={styles.successTitle}>Account created successfully! 🎉</h2>
              <p className={styles.successText}>
                Welcome to LifeOS! You can now log in to your account.
              </p>
              
              <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none', textAlign: 'center', marginTop: '20px' }}>
                Go to Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
