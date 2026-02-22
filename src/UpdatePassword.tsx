
import React, { useState } from 'react';
import { supabase } from '../api/supabase';
import { useTranslations } from './hooks/useTranslations';

interface UpdatePasswordProps {
  onUpdated: () => void;
  language: 'ar' | 'nl';
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onUpdated, language }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const t = useTranslations(language);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t.updatePassword.passwordsDoNotMatch);
      return;
    }
    if (password.length < 6) {
        // Re-using the translation from the other password modal for consistency.
        alert(t.userManagement.updatePasswordModal.passwordTooShort);
        return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      alert(`${t.updatePassword.updateError} ${error.message}`);
    } else {
      alert(t.updatePassword.updateSuccess);
      onUpdated(); // This will hide the component
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h2 className="text-center text-2xl font-bold text-indigo-700 mb-2">{t.updatePassword.title}</h2>
        <p className="text-center text-sm text-slate-500 mb-8">{t.updatePassword.subtitle}</p>
        <form onSubmit={handleUpdatePassword}>
          <div className="space-y-4">
            <input
              type="password"
              placeholder={t.updatePassword.passwordPlaceholder}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder={t.updatePassword.confirmPasswordPlaceholder}
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
            {loading ? t.updatePassword.loading : t.updatePassword.updateButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
