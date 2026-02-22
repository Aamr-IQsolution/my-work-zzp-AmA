
import React, { useState } from 'react';
import { supabase } from './api/supabase';
import { useTranslations } from './src/hooks/useTranslations';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'nl'>('ar');

  const t = useTranslations(language);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    }
    // On successful sign-up or sign-in, the onAuthStateChange listener in App.tsx will handle the session.
    setLoading(false);
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // The user will be redirected here after resetting the password.
    });
    
    if (error) {
      alert(error.message);
    } else {
      alert(t.auth.passwordResetSuccess);
      setIsForgotPassword(false); // Switch back to the login view
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false); // Always reset forgot password mode when toggling
    setEmail('');
    setPassword('');
  };

  const renderContent = () => {
    if (isForgotPassword) {
      return (
        <>
          <h2 className="text-center text-2xl font-bold text-indigo-700 mb-2">
            {t.auth.resetPasswordTitle}
          </h2>
          <p className="text-center text-sm text-slate-500 mb-8">
            {t.auth.resetPasswordSubtitle}
          </p>
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder={t.auth.emailPlaceholder}
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-400"
            >
              {loading ? t.auth.loadingButton : t.auth.sendResetEmailButton}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsForgotPassword(false)} className="text-sm font-medium text-indigo-600 hover:underline">
              {t.auth.backToLogin}
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="text-center text-2xl font-bold text-indigo-700 mb-2">
          {isSignUp ? t.auth.signUpTitle : t.auth.signInTitle}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-8">
          {isSignUp ? t.auth.signUpSubtitle : t.auth.signInSubtitle}
        </p>

        <form onSubmit={handleAuth}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder={t.auth.emailPlaceholder}
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              dir="ltr"
            />
            <input
              type="password"
              placeholder={t.auth.passwordPlaceholder}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              dir="ltr"
            />
          </div>

          {!isSignUp && (
            <div className="text-right mt-4">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                {t.auth.forgotPassword}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-400"
          >
            {loading ? t.auth.loadingButton : (isSignUp ? t.auth.signUpButton : t.auth.signInButton)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={toggleMode} className="text-sm font-medium text-indigo-600 hover:underline">
            {isSignUp ? t.auth.toggleToSignIn : t.auth.toggleToSignUp}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Language Switcher */}
        <div className="text-center mb-6">
          <button 
            onClick={() => setLanguage('ar')} 
            className={`px-3 py-1 text-sm rounded-full ${language === 'ar' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            العربية
          </button>
          <button 
            onClick={() => setLanguage('nl')} 
            className={`px-3 py-1 text-sm rounded-full ml-2 ${language === 'nl' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            Nederlands
          </button>
        </div>

        {renderContent()}

      </div>
    </div>
  );
};

export default Auth;
