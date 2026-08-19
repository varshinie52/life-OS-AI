'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';
import { useToast } from '@/context/ToastContext';

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { showToast } = useToast();

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (strength < 5) {
      showToast('Please meet all password requirements.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiUrl}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
      } else {
        if (data.message?.toLowerCase().includes('expire') || data.message?.toLowerCase().includes('invalid')) {
          setErrorMessage(data.message || 'This password reset link is invalid or has expired.');
          setStatus('error');
        } else {
          showToast(data.message || 'Failed to reset password.', 'error');
        }
      }
    } catch (err) {
      showToast('A network error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgDecoration} />
      <div className={styles.card}>
        <AnimatePresence mode="wait">
          {status === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Lock size={24} />
                </div>
              </div>
              <h1 className={styles.heading}>Set New Password</h1>
              <p className={styles.subtitle}>Enter your new password below.</p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={styles.input}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibility}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={styles.input}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibility}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBars}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`${styles.strengthBar} ${
                            strength >= level ? styles[`strength${strength}`] : ''
                          }`}
                        />
                      ))}
                    </div>
                    
                    <ul className={styles.requirementsList}>
                      {requirements.map((req, i) => (
                        <li key={i} className={req.met ? styles.reqMet : styles.reqUnmet}>
                          {req.met ? '✓' : '○'} {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button 
                  type="submit" 
                  className={styles.submitButton} 
                  disabled={isLoading || !password || password !== confirmPassword || strength < 5}
                >
                  {isLoading ? <Loader2 size={18} className={styles.spinner} /> : 'Reset Password'}
                </button>
              </form>

              <div className={styles.footer}>
                <Link href="/login" className={styles.backLink}>
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </Link>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={styles.stateContainer}
            >
              <div className={styles.iconContainer}>
                <motion.svg width="80" height="80" viewBox="0 0 100 100" className={styles.successSvg}>
                  <circle cx="50" cy="50" r="45" className={styles.successCircle} />
                  <motion.path
                    d="M30 50 L45 65 L70 35"
                    className={styles.successCheck}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.svg>
              </div>
              
              <h1 className={styles.heading}>Password Reset!</h1>
              <p className={styles.subtitle}>Your password has been changed successfully.</p>

              <Link href="/login" className={styles.button}>
                Continue to Login
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={styles.stateContainer}
            >
              <div className={styles.iconContainer}>
                <motion.svg width="80" height="80" viewBox="0 0 100 100" className={styles.errorSvg}>
                  <circle cx="50" cy="50" r="45" className={styles.errorCircle} />
                  <motion.path
                    d="M35 35 L65 65 M65 35 L35 65"
                    className={styles.errorX}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.svg>
              </div>
              
              <h1 className={styles.heading}>Reset Link Expired</h1>
              <p className={styles.subtitle}>{errorMessage}</p>

              <Link href="/forgot-password" className={styles.button}>
                Request New Link
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
