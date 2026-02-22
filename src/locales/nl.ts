
export const nl = {
  // General
  general: {
    save: 'Opslaan',
    update: 'Bijwerken',
    cancel: 'Annuleren',
    add: 'Toevoegen',
    clear: 'Wissen',
    back: 'Terug',
    confirmAction: 'Weet u het zeker?',
    nameRequired: 'Naam is verplicht',
    loading: 'Laden...',
  },
  
  // Auth.tsx
  auth: {
    signUpTitle: 'Nieuw account aanmaken',
    signInTitle: 'Inloggen',
    signUpSubtitle: 'Voer uw gegevens in om lid te worden',
    signInSubtitle: 'Welkom terug! Voer uw gegevens in',
    emailPlaceholder: 'E-mailadres',
    passwordPlaceholder: 'Wachtwoord',
    signUpButton: 'Account aanmaken',
    signInButton: 'Inloggen',
    loadingButton: 'Laden...',
    toggleToSignIn: 'Heeft u al een account? Log in',
    toggleToSignUp: 'Geen account? Maak een nieuw account aan',
    forgotPassword: 'Wachtwoord vergeten?',
    resetPasswordTitle: 'Wachtwoord opnieuw instellen',
    resetPasswordSubtitle: 'Voer uw e-mailadres in om een link voor het opnieuw instellen te ontvangen',
    sendResetEmailButton: 'Link voor opnieuw instellen verzenden',
    passwordResetSuccess: 'Er is een e-mail voor het opnieuw instellen van het wachtwoord verzonden. Controleer uw inbox.',
    backToLogin: 'Terug naar inloggen',
  },

  // UpdatePassword.tsx (The one for password recovery flow)
  updatePassword: {
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

  // App.tsx -> UserManagement
  userManagement: {
    title: 'Gebruikersbeheer',
    loadingUsers: 'Gebruikers laden...',
    errorOccurred: 'Er is een fout opgetreden',
    errorHint: 'Zorg ervoor dat de Supabase-functie is geïmplementeerd en dat de RLS-beleidsregels correct zijn.',
    user: 'Gebruiker',
    admin: 'Beheerder',
    you: 'Jij',
    changePassword: 'Wachtwoord wijzigen',
    cannotChangeOwnRole: 'U kunt uw eigen rol niet wijzigen.',
    
    // Password update modal within UserManagement
    updatePasswordModal: {
      title: 'Wachtwoord bijwerken',
      newPasswordPlaceholder: 'Nieuw wachtwoord',
      confirmPasswordPlaceholder: 'Bevestig wachtwoord',
      passwordsDoNotMatch: 'Wachtwoorden komen niet overeen!',
      passwordTooShort: 'Wachtwoord moet minimaal 6 tekens lang zijn.',
      updateSuccess: 'Wachtwoord succesvol bijgewerkt!',
      updateError: 'Wachtwoord bijwerken mislukt.',
      updating: 'Bezig met bijwerken...',
    }
  },

  // App.tsx -> ScheduleApp
  scheduleApp: {
    headerTitle: 'Planningssysteem voor chauffeurs',
    manageUsers: 'Gebruikers',
    today: 'Vandaag',
    userRole: 'Gebruiker',
    adminRole: 'Admin',
    addDriver: 'Chauffeur toevoegen',
    driverNamePlaceholder: 'Naam...',
    drivers: 'Chauffeurs',
    noDrivers: 'Geen chauffeurs',
    week: 'Week',
    newTableDefault: 'Tabel',
    tableName: 'Tabelnaam',
    routeInfo: 'Route-info',
    day: 'Dag',
    morning: 'Ochtend',
    evening: 'Avond',
    assign: '+ Toewijzen',
    noTableSelected: 'Geen tabel geselecteerd',
    selectOrAddTable: 'Selecteer of voeg een nieuwe tabel toe.',
    addTable: 'Nieuwe tabel toevoegen',
    selectDrivers: 'Selecteer chauffeurs',
    addDriverFirst: 'Voeg eerst een chauffeur toe',
    
    // WhatsApp sharing
    whatsapp: {
      schema: 'Schema',
      route: 'Route',
      noDriversAssigned: 'Geen',
      generatedBy: 'Gegenereerd door',
    }
  },
};
