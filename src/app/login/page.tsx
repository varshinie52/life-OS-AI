'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setNeedsVerification(false);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        showToast('Login successful! 🎉', 'success');
        router.push('/');
      } else {
        showToast(result.message || 'Invalid email or password.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Verification email resent successfully', 'success');
      } else {
        showToast(data.message || 'Failed to resend verification email', 'error');
      }
    } catch (err) {
      showToast('An error occurred while resending', 'error');
    } finally {
      setResending(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring' as const,
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
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
      
      <motion.div 
        className={styles.card}
        variants={cardVariants}
      >
        <motion.div className={styles.header} variants={itemVariants}>
          <div className={styles.logoContainer}>
            <div className={styles.logoBox}>
              <Check size={24} strokeWidth={3} />
            </div>
            <h1 className={styles.logoText}>LifeOS</h1>
          </div>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to your account</p>
        </motion.div>

        <AnimatePresence>
          {needsVerification && (
            <motion.div 
              className={styles.verificationBanner}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            >
              <p className={styles.verificationText}>Your email address needs to be verified.</p>
              <button 
                onClick={handleResendVerification} 
                disabled={resending}
                className={styles.resendBtn}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className={styles.form}>
          <motion.div className={styles.inputGroup} variants={itemVariants}>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input 
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className={styles.errorText}
              >
                {errors.email}
              </motion.span>
            )}
          </motion.div>

          <motion.div className={styles.inputGroup} variants={itemVariants}>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                disabled={loading}
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
            {errors.password && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className={styles.errorText}
              >
                {errors.password}
              </motion.span>
            )}
          </motion.div>

          <motion.div className={styles.row} variants={itemVariants}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              Remember Me
            </label>
            <Link href="/forgot-password" className={styles.link}>
              Forgot Password?
            </Link>
          </motion.div>

          <motion.button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <Loader2 className={styles.spinning} size={20} />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <motion.div className={styles.divider} variants={itemVariants}>
          or
        </motion.div>

        <motion.div className={styles.footer} variants={itemVariants}>
          Don't have an account? <Link href="/signup" className={styles.link}>Create one</Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
