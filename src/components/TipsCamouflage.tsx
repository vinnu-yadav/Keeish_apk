import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  Smartphone,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  UserPlus,
  LogIn,
  KeyRound,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface TipsCamouflageProps {
  onLoginSuccess: () => void;
  isRevealing: boolean;
}

export const TipsCamouflage: React.FC<TipsCamouflageProps> = ({
  onLoginSuccess,
  isRevealing
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showManuals, setShowManuals] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowRegisterPrompt(false);

    try {
      if (authMode === 'register') {
        // Create new account
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
        onLoginSuccess();
      } else {
        // Sign in to existing account
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      const code = err?.code || 'unknown-error';
      
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
        setErrorMsg('Invalid credentials or account does not exist yet.');
        setShowRegisterPrompt(true);
      } else if (code === 'auth/wrong-password') {
        setErrorMsg('Incorrect password. Click below to reset if forgotten.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Switch to Sign In.');
        setAuthMode('signin');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters long.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many attempts. Please wait a moment or reset your password.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Check your internet connection.');
      } else {
        setErrorMsg(`Authentication notice: ${err?.message || code}`);
      }
      setIsLoading(false);
    }
  };

  // Instant register helper when sign-in fails
  const handleQuickRegister = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters to create an account.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setShowRegisterPrompt(false);

    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
      onLoginSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please verify your password.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(err?.message || 'Could not register account. Try another email.');
      }
      setIsLoading(false);
    }
  };

  // Password reset helper
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your account email first to receive the reset link.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg(`Password reset link sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send reset email. Ensure the address is correct.');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest / Demo access
  const handleGuestAccess = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Anonymous auth unavailable, trying demo account…', err);
      // Fallback: try demo reader account
      try {
        await signInWithEmailAndPassword(auth, 'demo@keeish.app', 'keeish1234');
        onLoginSuccess();
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, 'demo@keeish.app', 'keeish1234');
          onLoginSuccess();
        } catch (demoErr: any) {
          setErrorMsg('Please register a reader account with your own email and password above.');
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Top action bar: Clean camouflage badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111e30]/80 border border-[#25364e] text-[11px] text-[#a6b5ca] backdrop-blur-md">
          <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Tips v1.0.0</span>
        </div>
      </div>

      {/* Main card */}
      <section
        className={`w-full max-w-[440px] p-7 sm:p-8 rounded-[26px] bg-[#101b2ceb] border border-[#2a3b51] shadow-[0_25px_90px_rgba(0,0,0,0.5)] transition-all duration-700 ${
          isRevealing ? 'scale-105 border-rose-500/40 shadow-rose-950/30' : ''
        }`}
      >
        {/* Brand logo: Transitions from Yellow Lightbulb to Pink Heart */}
        <div
          className={`grid place-items-center w-[62px] h-[62px] rounded-[18px] transition-all duration-700 select-none ${
            isRevealing
              ? 'bg-gradient-to-br from-[#ff4d6d] to-[#e11d48] text-white shadow-[0_8px_30px_rgba(255,77,109,0.65)] anim-heart-pulse'
              : 'bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-white shadow-[0_6px_26px_rgba(245,158,11,0.45)]'
          }`}
        >
          {isRevealing ? (
            <svg
              className="w-8 h-8 fill-white anim-pop-in drop-shadow-[0_2px_6px_rgba(255,255,255,0.45)]"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 fill-none drop-shadow-[0_2px_6px_rgba(255,255,255,0.45)]"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
                fill="#ffffff"
              />
              <path d="M9 19h6c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1z" fill="#ffffff" />
              <path d="M10 21h4c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1z" fill="#ffffff" />
            </svg>
          )}
        </div>

        {/* Eyebrow */}
        <div
          className={`mt-5 text-[11px] font-bold tracking-[2px] uppercase transition-colors duration-500 ${
            isRevealing ? 'text-[#ffaec0]' : 'text-[#67e8c4]'
          }`}
        >
          {isRevealing ? 'Keeish · Private Space' : 'Tips · Manuals & Guides'}
        </div>

        {/* Heading */}
        <h1 className="mt-3 mb-2 text-3xl sm:text-[33px] font-black leading-tight text-white transition-all duration-500">
          {isRevealing ? (
            <>
              Your people.
              <br />
              Your space.
            </>
          ) : authMode === 'register' ? (
            <>
              Create reader.
              <br />
              Access guides.
            </>
          ) : (
            <>
              Practical manuals.
              <br />
              Quick tips.
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#9daec2] leading-relaxed mb-5">
          {isRevealing
            ? 'Welcome back to Keeish Chat.'
            : authMode === 'register'
            ? 'Register your manual reader account to save bookmarks and tips.'
            : 'Sign in with your manual reader account to access guides.'}
        </p>

        {/* Auth Mode Toggle Tabs (only when not in revealing transition) */}
        {!isRevealing && (
          <div className="flex p-1 mb-4 rounded-xl bg-[#0b1525] border border-[#27384e]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg('');
                setShowRegisterPrompt(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMode === 'signin'
                  ? 'bg-[#1b2b40] text-[#67e8c4] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setShowRegisterPrompt(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMode === 'register'
                  ? 'bg-[#1b2b40] text-[#67e8c4] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#c8d3e2] mb-1" htmlFor="email">
              Account email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isRevealing || isLoading}
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-[13px] bg-[#0b1525] border border-[#35465e] text-white text-sm outline-none focus:border-[#67e8c4] focus:ring-2 focus:ring-[#67e8c4]/20 transition disabled:opacity-60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#c8d3e2]" htmlFor="password">
                Security password
              </label>
              {authMode === 'signin' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[#67e8c4] hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authMode === 'register' ? 'Choose a password (min 6 chars)' : 'Enter your password'}
              required
              disabled={isRevealing || isLoading}
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              className="w-full px-3.5 py-2.5 rounded-[13px] bg-[#0b1525] border border-[#35465e] text-white text-sm outline-none focus:border-[#67e8c4] focus:ring-2 focus:ring-[#67e8c4]/20 transition disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isRevealing}
            className="w-full min-h-[44px] mt-1 py-2.5 px-4 rounded-xl bg-[#67e8c4] hover:bg-[#57dcaf] active:scale-[0.98] text-[#09271f] font-bold text-sm transition shadow-lg shadow-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRevealing
              ? 'Opening Keeish…'
              : isLoading
              ? 'Verifying…'
              : authMode === 'register'
              ? 'Create Reader Account'
              : 'Sign in'}
          </button>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[#ffb4b4] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {showRegisterPrompt && (
                  <button
                    type="button"
                    onClick={handleQuickRegister}
                    className="block mt-2 font-bold text-white underline hover:text-[#67e8c4] transition"
                  >
                    👉 Click here to create an account with this email &amp; password
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Quick guest reader test access button */}
        {!isRevealing && (
          <div className="mt-3 pt-3 border-t border-[#1e2f44] flex items-center justify-between text-xs">
            <span className="text-[#8ca1b8] text-[11px]">Testing without credentials?</span>
            <button
              type="button"
              onClick={handleGuestAccess}
              disabled={isLoading}
              className="flex items-center gap-1 text-[11px] font-bold text-[#67e8c4] hover:text-[#8afcdb] hover:underline transition"
            >
              <Sparkles className="w-3 h-3 text-[#fbbf24]" />
              <span>One-Click Guest Access</span>
            </button>
          </div>
        )}

        {/* Reveal banner when credentials match and Keeish is unlocking */}
        {isRevealing && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-[#ffaec0] text-xs font-bold text-center anim-banner-pulse">
            ❤️ Access Granted — Accessing Keeish Space…
          </div>
        )}

        {/* Disguise footer note */}
        <p className="mt-5 text-xs text-[#9daec2] text-center">
          The app that offers manuals and everyday handy tips.
        </p>

        {/* Interactive disguise expander: sample manuals */}
        {!isRevealing && (
          <div className="mt-4 pt-3 border-t border-[#1e2f44]">
            <button
              type="button"
              onClick={() => setShowManuals(!showManuals)}
              className="w-full flex items-center justify-between text-xs text-[#a6b5ca] hover:text-white transition py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Lightbulb className="w-3.5 h-3.5 text-[#fbbf24]" />
                Browse Quick Manuals (Guest)
              </span>
              {showManuals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManuals && (
              <div className="mt-2.5 space-y-2 text-xs text-gray-300">
                <div className="p-2.5 rounded-lg bg-[#0b1525] border border-[#203248]">
                  <strong className="text-[#67e8c4] block mb-0.5">Quick Guide #1: Keyboard Mastery</strong>
                  <span>Use Ctrl+Shift+T to restore closed tabs; Alt+Tab to cycle windows efficiently.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b1525] border border-[#203248]">
                  <strong className="text-[#67e8c4] block mb-0.5">Quick Guide #2: Device Battery Care</strong>
                  <span>Keep lithium-ion batteries between 20% and 80% charge for maximum life cycle.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
