
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './api/supabase';
import Auth from './Auth';
import UpdatePassword from './src/UpdatePassword';
import ScheduleApp from './src/components/ScheduleApp';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'nl'>('ar');

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If the event is for password recovery, set the corresponding state
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // This function is called after the user successfully updates their password during recovery
  const handlePasswordUpdated = () => {
    setIsPasswordRecovery(false);
    // Clean the URL from password recovery tokens
    window.history.replaceState({}, document.title, window.location.pathname);
    // Sign the user out to force a new login with the new password
    supabase.auth.signOut();
  };

  // If there is no active session, show the authentication page
  if (!session) {
    // The Auth component now manages its own internal state, including language.
    return <Auth />;
  } 
  
  // If the user is in the password recovery flow, show the password update screen
  if (isPasswordRecovery) {
    // Pass the global language state down, as this component doesn't have a language switcher
    return <UpdatePassword onUpdated={handlePasswordUpdated} language={language} />;
  }
  
  // If the user is logged in, show the main application
  return <ScheduleApp session={session} language={language} setLanguage={setLanguage} />;
}

export default App;
