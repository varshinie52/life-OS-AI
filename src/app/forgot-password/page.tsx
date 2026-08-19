'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import styles from './page.module.css';
import { useToast } from '@/context/ToastContext';
import { isValidEmail } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('OTP sent to your email address!', 'success');
        setStep('otp');
        setCooldown(30);
      } else {
        showToast(data.message || 'Unable to send OTP. Please try again.', 'error');
      }
    } catch (err) {
      showToast('A network error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('A new OTP has been sent to your email address!', 'success');
        setCooldown(30);
      } else {
        showToast(data.message || 'Failed to resend OTP.', 'error');
      }
    } catch (err) {
      showToast('A network error occurred while resending OTP.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP code' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: cleanOtp }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('OTP verified successfully! ✅', 'success');
        setStep('password');
      } else {
        showToast(data.message || 'Invalid OTP. Please try again.', 'error');
        setErrors({ otp: data.message || 'Invalid OTP. Please try again.' });
      }
    } catch (err) {
      showToast('A network error occurred during verification.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim(), password }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Password changed successfully! 🎉', 'success');
        setStep('success');
      } else {
        showToast(data.message || 'Failed to reset password. Please try again.', 'error');
      }
    } catch (err) {
      showToast('A network error occurred while resetting password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgDecoration} />
      <div className={styles.card}>
        <AnimatePresence mode="wait">
          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Mail size={24} />
                </div>
              </div>
              <h1 className={styles.heading}>Forgot Password</h1>
              <p className={styles.subtitle}>
                Enter your email address to receive a 6-digit OTP code.
              </p>

              <form onSubmit={handleSendOtp} className={styles.form}>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input
                      type="email"
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading || !email}>
                  {isLoading ? <Loader2 size={18} className={styles.spinner} /> : 'Send OTP'}
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

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <KeyRound size={24} />
                </div>
              </div>
              <h1 className={styles.heading}>Enter Verification Code</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit OTP to <span className={styles.highlight}>{email}</span>.
              </p>

              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <KeyRound size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      maxLength={6}
                      className={`${styles.input} ${errors.otp ? styles.inputError : ''}`}
                      style={{ letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}
                      placeholder="------"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (errors.otp) setErrors({ ...errors, otp: '' });
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.otp && <span className={styles.errorText}>{errors.otp}</span>}
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading || otp.trim().length !== 6}>
                  {isLoading ? <Loader2 size={18} className={styles.spinner} /> : 'Verify OTP'}
                </button>
              </form>

              <div className={styles.resendSection} style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isLoading}
                  className={styles.resendButton}
                  style={{ background: 'none', border: 'none', color: cooldown > 0 ? 'var(--text-muted)' : 'var(--moss)', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className={styles.footer} style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className={styles.backLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Change Email</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 'password' && (
            <motion.div
              key="step-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Lock size={24} />
                </div>
              </div>
              <h1 className={styles.heading}>Create New Password</h1>
              <p className={styles.subtitle}>
                Password must be at least 8 characters.
              </p>

              <form onSubmit={handleResetPassword} className={styles.form}>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', paddingRight: '12px' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', paddingRight: '12px' }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className={styles.submitButton} disabled={isLoading}>
                  {isLoading ? <Loader2 size={18} className={styles.spinner} /> : 'Reset Password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}
            >
              <div className={styles.logoWrapper} style={{ margin: '0 auto 16px auto' }}>
                <div className={styles.logoIcon}>
                  <CheckCircle2 size={32} color="var(--moss)" />
                </div>
              </div>
              <h1 className={styles.heading}>Password Changed! 🎉</h1>
              <p className={styles.subtitle}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>

              <Link
                href="/login"
                className={styles.submitButton}
                style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px', width: '100%', boxSizing: 'border-box' }}
              >
                Back to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
