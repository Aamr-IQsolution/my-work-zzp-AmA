
import React, { useState } from 'react';
import { supabase } from '../api/supabase';

// Simple translations for this component
const translations = {
  ar: {
    title: 'تحديث كلمة المرور',
    subtitle: 'أنت الآن مسجل للدخول. أدخل كلمة المرور الجديدة.',
    passwordPlaceholder: 'كلمة المرور الجديدة',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور الجديدة',
    updateButton: 'تحديث كلمة المرور',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين!',
    updateSuccess: 'تم تحديث كلمة المرور بنجاح!',
    updateError: 'فشل تحديث كلمة المرور. حاول مرة أخرى.',
    loading: 'جاري التحديث...',
  },
  nl: {
    title: 'Wachtwoord bijwerken',
    subtitle: 'U bent nu ingelogd. Voer uw nieuwe wachtwoord in.',
    passwordPlaceholder: 'Nieuw wachtwoord',
    confirmPasswordPlaceholder: 'Bevestig nieuw wachtwoord',
    updateButton: 'Wachtwoord bijwerken',
    passwordsDoNotMatch: 'Wachtwoorden komen niet overeen!',
    updateSuccess: 'Wachtwoord succesvol bijgewerkt!',
    updateError: 'Wachtwoord bijwerken mislukt. Probeer het opnieuw.',
    loading: 'Bezig met bijwerken...',
  },
  en: {
    title: 'Update Password',
    subtitle: 'You are now logged in. Enter your new password.',
    passwordPlaceholder: 'New password',
    confirmPasswordPlaceholder: 'Confirm new password',
    updateButton: 'Update Password',
    passwordsDoNotMatch: 'Passwords do not match!',
    updateSuccess: 'Password updated successfully!',
    updateError: 'Failed to update password. Try again.',
    loading: 'Updating...',
  }
};

const UpdatePassword: React.FC<{ onUpdated: () => void }> = ({ onUpdated }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [language] = useState<'ar' | 'nl' | 'en'>('ar'); // Assuming 'ar' default, could be passed as prop

  const t = translations[language];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t.passwordsDoNotMatch);
      return;
    }
    if (password.length < 6) {
        alert('Password should be at least 6 characters.');
        return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      alert(`${t.updateError} ${error.message}`);
    } else {
      alert(t.updateSuccess);
      onUpdated(); // This will hide the component
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h2 className="text-center text-2xl font-bold text-indigo-700 mb-2">{t.title}</h2>
        <p className="text-center text-sm text-slate-500 mb-8">{t.subtitle}</p>
        <form onSubmit={handleUpdatePassword}>
          <div className="space-y-4">
            <input
              type="password"
              placeholder={t.passwordPlaceholder}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder={t.confirmPasswordPlaceholder}
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
          >
            {loading ? t.loading : t.updateButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
