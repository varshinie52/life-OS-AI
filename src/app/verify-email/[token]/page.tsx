'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import styles from './page.module.css';

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
        } else {
          setErrorMessage(data.message || 'Verification failed. The link may have expired.');
          setStatus('error');
        }
      } catch (err) {
        setErrorMessage('A network error occurred. Please try again.');
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className={styles.container}>
      <div className={styles.bgDecoration} />
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <Mail size={24} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.stateContainer}
            >
              <div className={styles.pulsingCircle} />
              <h1 className={styles.heading}>Verifying your email...</h1>
              <p className={styles.subtitle}>Please wait while we verify your link.</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
              <h1 className={styles.heading}>Email Verified!</h1>
              <p className={styles.subtitle}>Your account has been verified. You can now sign in.</p>
              <Link href="/login" className={styles.button}>
                Continue to Login
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
              <h1 className={styles.heading}>Verification Failed</h1>
              <p className={styles.subtitle}>{errorMessage}</p>
              <Link href="/login" className={styles.linkButton}>
                Back to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
