
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { useTranslations } from '../hooks/useTranslations';
import { KeyRoundIcon } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface UserManagementProps {
  session: Session;
  onBack: () => void;
  language: 'ar' | 'nl';
}

const UserManagement: React.FC<UserManagementProps> = ({ session, onBack, language }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const t = useTranslations(language);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordUpdateMessage({ text: t.userManagement.updatePasswordModal.passwordsDoNotMatch, type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordUpdateMessage({ text: t.userManagement.updatePasswordModal.passwordTooShort, type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      setPasswordUpdateMessage({ text: `${t.userManagement.updatePasswordModal.updateError} ${error.message}`, type: 'error' });
    } else {
      setPasswordUpdateMessage({ text: t.userManagement.updatePasswordModal.updateSuccess, type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordUpdateMessage(null);
      }, 2000);
    }
  };
  
  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordUpdateMessage(null);
    setIsPasswordModalOpen(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !currentSession) throw new Error(sessionError?.message || "Authentication session not found.");
        const { data, error: functionsError } = await supabase.functions.invoke('get-users', {
          headers: { 'Authorization': `Bearer ${currentSession.access_token}` }
        });
        if (functionsError) throw functionsError;
        setUsers(data);
      } catch (e: any) {
        console.error("Error invoking get-users function:", e);
        const errorMsg = e.context?.json ? (await e.context.json()).error : e.message;
        setError(errorMsg || `An unknown error occurred.`);
      } finally {
        setLoading(false);
      }
    };
    if (session) {
      fetchUsers();
    }
  }, [session]);

  const updateUserRole = async (userId: string, newRole: string) => {
    if (userId === session.user.id) { 
        alert(t.userManagement.cannotChangeOwnRole); 
        return; 
    }
    const originalUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) { 
      alert('Failed to update role.'); 
      setUsers(originalUsers);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-indigo-700 text-white sticky top-0 z-20"><div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-bold">{t.userManagement.title}</h1><button onClick={onBack} className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl"><span className="font-bold text-sm">{t.general.back}</span></button></div></header>
      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-500">{t.userManagement.loadingUsers}</div>
            ) : error ? (
              <div className="p-10 text-center text-red-600 bg-red-50">
                <p className="font-bold mb-2">{t.userManagement.errorOccurred}</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-4 text-slate-500">{t.userManagement.errorHint}</p>
              </div>
            ) : users.map(user => (
              <div key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="font-bold text-slate-800">{user.email}</p>
                <div className="flex items-center gap-2">
                  <select 
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={user.id === session.user.id} 
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="user">{t.userManagement.user}</option>
                    <option value="admin">{t.userManagement.admin}</option>
                  </select>
                  {user.id === session.user.id && (
                    <>
                      <span className="text-xs text-slate-400 font-bold">({t.userManagement.you})</span>
                      <button onClick={openPasswordModal} title={t.userManagement.changePassword} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <KeyRoundIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
            <form onSubmit={handleUpdatePassword}>
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-slate-800">{t.userManagement.updatePasswordModal.title}</h3>
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="password"
                  placeholder={t.userManagement.updatePasswordModal.newPasswordPlaceholder}
                  value={newPassword}
                  required
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="password"
                  placeholder={t.userManagement.updatePasswordModal.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
                {passwordUpdateMessage && (
                  <div className={`p-3 rounded-lg text-sm font-semibold ${passwordUpdateMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {passwordUpdateMessage.text}
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-colors">{t.general.cancel}</button>
                <button type="submit" disabled={isUpdatingPassword} className="px-6 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
                  {isUpdatingPassword ? t.userManagement.updatePasswordModal.updating : t.general.update}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
