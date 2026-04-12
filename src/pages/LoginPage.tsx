import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { auth } from '../config/firebase';
import { EMAIL_KEY } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';

type View = 'checking' | 'form' | 'sent';

export const LoginPage = () => {
  const { sendLoginLink } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const stored = localStorage.getItem(EMAIL_KEY) ?? '';
      signInWithEmailLink(auth, stored, window.location.href)
        .then(() => {
          localStorage.removeItem(EMAIL_KEY);
          navigate('/', { replace: true });
        })
        .catch((err: Error) => {
          setError(err.message ?? 'Sign-in failed. Please request a new link.');
          setView('form');
        });
    } else {
      setView('form');
    }
  }, [navigate]);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await sendLoginLink(trimmed);
      setView('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'checking') return null;

  return (
    <div className="wl-register-root">
      <div className="wl-register-card">
        <h1 className="wl-register-title">WildcatLedger</h1>

        {view === 'form' && (
          <>
            <p className="wl-register-subtitle">
              Enter your email to receive a sign-in link. No password needed.
            </p>
            <div className="wl-login-field">
              <label className="wl-login-label" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="wl-form-input wl-login-input"
                value={email}
                placeholder="you@northwestern.edu"
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            {error && <div className="wl-form-error wl-login-error">{error}</div>}
            <button
              type="button"
              className="wl-btn-primary wl-register-done"
              onClick={handleSend}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send me a link'}
            </button>
          </>
        )}

        {view === 'sent' && (
          <div className="wl-login-sent">
            <div className="wl-login-sent-icon" aria-hidden="true">
              ✉
            </div>
            <p className="wl-login-sent-heading">Check your email</p>
            <p className="wl-login-sent-body">
              We sent a sign-in link to <strong>{email}</strong>. Click it to sign in —
              the link expires in 1 hour.
            </p>
            <button
              type="button"
              className="wl-login-sent-retry"
              onClick={() => {
                setView('form');
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
