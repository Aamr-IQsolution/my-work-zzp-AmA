
import React, { useState } from 'react';
import { supabase } from './api/supabase';

// Define the structure for our translations
interface AuthTranslations {
  signUpTitle: string;
  signInTitle: string;
  signUpSubtitle: string;
  signInSubtitle: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  signUpButton: string;
  signInButton: string;
  loadingButton: string;
  toggleToSignIn: string;
  toggleToSignUp: string;
  forgotPassword: string;
  resetPasswordTitle: string;
  resetPasswordSubtitle: string;
  sendResetEmailButton: string;
  passwordResetSuccess: string;
  backToLogin: string;
}

// Create a dictionary for all supported languages
const translations: Record<string, AuthTranslations> = {
  ar: {
    signUpTitle: 'إنشاء حساب جديد',
    signInTitle: 'تسجيل الدخول',
    signUpSubtitle: 'أدخل بياناتك للانضمام إلى النظام',
    signInSubtitle: 'مرحباً بعودتك! أدخل بياناتك للمتابعة',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    signUpButton: 'إنشاء حساب',
    signInButton: 'تسجيل الدخول',
    loadingButton: 'جاري التحميل...',
    toggleToSignIn: 'هل لديك حساب بالفعل؟ تسجيل الدخول',
    toggleToSignUp: 'ليس لديك حساب؟ إنشاء حساب جديد',
    forgotPassword: 'هل نسيت كلمة السر؟',
    resetPasswordTitle: 'إعادة تعيين كلمة المرور',
    resetPasswordSubtitle: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين',
    sendResetEmailButton: 'إرسال رابط إعادة التعيين',
    passwordResetSuccess: 'تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور. يرجى التحقق من بريدك الوارد.',
    backToLogin: 'العودة إلى تسجيل الدخول',
  },
  nl: {
    signUpTitle: 'Nieuw account aanmaken',
    signInTitle: 'Inloggen',
    signUpSubtitle: 'Voer uw gegevens in om deel te nemen',
    signInSubtitle: 'Welkom terug! Voer uw gegevens in om verder te gaan',
    emailPlaceholder: 'E-mailadres',
    passwordPlaceholder: 'Wachtwoord',
    signUpButton: 'Account aanmaken',
    signInButton: 'Inloggen',
    loadingButton: 'Bezig met laden...',
    toggleToSignIn: 'Heeft u al een account? Inloggen',
    toggleToSignUp: 'Geen account? Nieuw account aanmaken',
    forgotPassword: 'Wachtwoord vergeten?',
    resetPasswordTitle: 'Wachtwoord opnieuw instellen',
    resetPasswordSubtitle: 'Voer uw e-mailadres in om een resetlink te ontvangen',
    sendResetEmailButton: 'Resetlink verzenden',
    passwordResetSuccess: 'Er is een e-mail voor het opnieuw instellen van het wachtwoord verzonden. Controleer uw inbox.',
    backToLogin: 'Terug naar inloggen',
  },
  en: {
    signUpTitle: 'Create a New Account',
    signInTitle: 'Sign In',
    signUpSubtitle: 'Enter your details to join',
    signInSubtitle: 'Welcome back! Enter your details to continue',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    signUpButton: 'Create Account',
    signInButton: 'Sign In',
    loadingButton: 'Loading...',
    toggleToSignIn: 'Already have an account? Sign In',
    toggleToSignUp: 'Don\'t have an account? Create a new one',
    forgotPassword: 'Forgot your password?',
    resetPasswordTitle: 'Reset Password',
    resetPasswordSubtitle: 'Enter your email to receive a reset link',
    sendResetEmailButton: 'Send Reset Link',
    passwordResetSuccess: 'Password reset email sent. Please check your inbox.',
    backToLogin: 'Back to Sign In',
  },
};


const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [language, setLanguage] = useState('ar');

  const t = translations[language] || translations.en;

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
      alert(t.passwordResetSuccess);
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
            {t.resetPasswordTitle}
          </h2>
          <p className="text-center text-sm text-slate-500 mb-8">
            {t.resetPasswordSubtitle}
          </p>
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder={t.emailPlaceholder}
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
              {loading ? t.loadingButton : t.sendResetEmailButton}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsForgotPassword(false)} className="text-sm font-medium text-indigo-600 hover:underline">
              {t.backToLogin}
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="text-center text-2xl font-bold text-indigo-700 mb-2">
          {isSignUp ? t.signUpTitle : t.signInTitle}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-8">
          {isSignUp ? t.signUpSubtitle : t.signInSubtitle}
        </p>

        <form onSubmit={handleAuth}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              dir="ltr"
            />
            <input
              type="password"
              placeholder={t.passwordPlaceholder}
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
                {t.forgotPassword}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-400"
          >
            {loading ? t.loadingButton : (isSignUp ? t.signUpButton : t.signInButton)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={toggleMode} className="text-sm font-medium text-indigo-600 hover:underline">
            {isSignUp ? t.toggleToSignIn : t.toggleToSignUp}
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
