import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Shield, AlertCircle, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import logoImg from '../assets/images/app_logo_1786099253668.jpg';

interface SignInPanelProps {
  onSignIn: () => void;
  onClose?: () => void;
  onBack?: () => void;
}

export default function SignInPanel({ onSignIn, onClose, onBack }: SignInPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackAction = onClose || onBack;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isResetMode) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent. Please check your inbox.');
      } else if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        onSignIn();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSignIn();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSignIn();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="flex items-center justify-center p-2">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 relative">
        {/* Back Button */}
        {handleBackAction && (
          <button
            type="button"
            onClick={handleBackAction}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-4 cursor-pointer group"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Homepage</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <img src={logoImg} alt="Logo" className="w-14 h-14 rounded-xl mb-3 shadow-md" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Budget Portfolio</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {isResetMode ? 'Account Recovery' : isSignUpMode ? 'Create New Account' : 'Sign In to Your Vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetMode && (
            <div>
              <label htmlFor="signin-email-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                id="signin-email-input"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          )}

          {!isResetMode && (
            <div>
              <label htmlFor="signin-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                id="signin-password-input"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUpMode ? "new-password" : "current-password"}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-800"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</p>}
          {message && <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">{message}</p>}

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-blue-600/20 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isResetMode ? (
              <span>Send Reset Email</span>
            ) : isSignUpMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {!isResetMode && (
          <button
            onClick={handleGoogleSignIn}
            className="w-full mt-3 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Sign in with Google</span>
          </button>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsResetMode(!isResetMode);
              setIsSignUpMode(false);
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            {isResetMode ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </>
            ) : (
              <span>Forgot Password?</span>
            )}
          </button>
          
          {!isResetMode && (
            <button 
              type="button"
              onClick={() => setIsSignUpMode(!isSignUpMode)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline block w-full cursor-pointer"
            >
              {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
