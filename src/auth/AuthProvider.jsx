import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { getStoredSession, setStoredSession, clearStoredSession } from './storage';
import { getCurrentUser, logoutUser } from '../api/auth';
import { setUnauthorizedHandler } from '../api/http';
import { clearDraft } from '../onboarding/draftStore';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState({
    user: null,
    token: null,
    expiresAt: null,
    status: 'loading',
  });

  // Register 401 callback for automatic session invalidation and redirection
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearDraft();
      setSession({
        user: null,
        token: null,
        expiresAt: null,
        status: 'anonymous',
      });
      navigate('/login');
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [navigate]);

  // Initial session restoration and validation against /api/me
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const stored = getStoredSession();
      if (!stored || !stored.token) {
        if (isMounted) {
          setSession({
            user: null,
            token: null,
            expiresAt: null,
            status: 'anonymous',
          });
        }
        return;
      }

      // Check client-side expiration (epoch in seconds)
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (typeof stored.expiresAt === 'number' && stored.expiresAt <= nowSeconds) {
        clearStoredSession();
        if (isMounted) {
          setSession({
            user: null,
            token: null,
            expiresAt: null,
            status: 'anonymous',
          });
        }
        return;
      }

      try {
        const freshUser = await getCurrentUser(stored.token);
        if (!freshUser) {
          throw new Error('No user profile returned');
        }

        // Refresh stored user data in place
        setStoredSession(
          {
            token: stored.token,
            expiresAt: stored.expiresAt,
            user: freshUser,
          },
          stored.storage === 'local'
        );

        if (isMounted) {
          setSession({
            user: freshUser,
            token: stored.token,
            expiresAt: stored.expiresAt,
            status: 'authenticated',
          });
        }
      } catch (err) {
        if (err?.status === 401) {
          clearStoredSession();
          if (isMounted) {
            setSession({
              user: null,
              token: null,
              expiresAt: null,
              status: 'anonymous',
            });
          }
        } else {
          // Network failure or 503: do not log the user out silently.
          // Keep stored session in storage and preserve authenticated status with stored user,
          // so the user can reload to retry.
          if (isMounted) {
            setSession({
              user: stored.user || null,
              token: stored.token,
              expiresAt: stored.expiresAt,
              status: stored.user ? 'authenticated' : 'anonymous',
            });
          }
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback((sessionData, rememberMe = false) => {
    const token = sessionData?.token ?? null;
    const expiresAt = sessionData?.expiresAt ?? null;
    const user = sessionData?.user ?? null;

    // Clear onboarding draft if a different user signs in
    const prevStored = getStoredSession();
    if (prevStored?.user?.id && user?.id && prevStored.user.id !== user.id) {
      clearDraft();
    }

    setStoredSession({ token, expiresAt, user }, rememberMe);

    setSession({
      user,
      token,
      expiresAt,
      status: 'authenticated',
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (session.token) {
        await logoutUser(session.token);
      }
    } catch {
      // Ignore network or 503 logout errors; we always purge the local session
    } finally {
      clearStoredSession();
      clearDraft();
      setSession({
        user: null,
        token: null,
        expiresAt: null,
        status: 'anonymous',
      });
    }
  }, [session.token]);

  const contextValue = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      expiresAt: session.expiresAt,
      status: session.status,
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
