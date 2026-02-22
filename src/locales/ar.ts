
export const ar = {
  // General
  general: {
    save: 'حفظ',
    update: 'تحديث',
    cancel: 'إلغاء',
    add: 'إضافة',
    clear: 'مسح',
    back: 'رجوع',
    confirmAction: 'هل أنت متأكد؟',
    nameRequired: 'الاسم مطلوب',
    loading: 'جاري التحميل...',
  },
  
  // Auth.tsx
  auth: {
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

  // UpdatePassword.tsx (The one for password recovery flow)
  updatePassword: {
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

  // App.tsx -> UserManagement
  userManagement: {
    title: 'إدارة المستخدمين',
    loadingUsers: 'جار تحميل المستخدمين...',
    errorOccurred: 'حدث خطأ',
    errorHint: 'تأكد من نشر دالة Supabase وتفعيل سياسات RLS الصحيحة.',
    user: 'مستخدم',
    admin: 'مشرف',
    you: 'أنت',
    changePassword: 'تغيير كلمة المرور',
    cannotChangeOwnRole: 'لا يمكنك تغيير دورك',
    
    // Password update modal within UserManagement
    updatePasswordModal: {
      title: 'تحديث كلمة المرور',
      newPasswordPlaceholder: 'كلمة المرور الجديدة',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين!',
      passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
      updateSuccess: 'تم تحديث كلمة المرور بنجاح!',
      updateError: 'فشل تحديث كلمة المرور.',
      updating: 'جاري التحديث...',
    }
  },

  // App.tsx -> ScheduleApp
  scheduleApp: {
    headerTitle: 'نظام جدولة السائقين',
    manageUsers: 'المستخدمين',
    today: 'اليوم',
    userRole: 'مستخدم',
    adminRole: 'مشرف',
    addDriver: 'إضافة سائق',
    driverNamePlaceholder: 'اسم السائق...',
    drivers: 'السائقين',
    noDrivers: 'لا يوجد سائقين',
    week: 'أسبوع',
    newTableDefault: 'جدول',
    tableName: 'اسم الجدول',
    routeInfo: 'معلومات الطريق',
    day: 'اليوم',
    morning: 'صباحي',
    evening: 'مسائي',
    assign: '+ تعيين',
    noTableSelected: 'لم يتم تحديد جدول',
    selectOrAddTable: 'اختر أو أضف جدولاً جديداً.',
    addTable: 'إضافة جدول',
    selectDrivers: 'اختيار السائقين',
    addDriverFirst: 'أضف سائقاً أولاً',
    
    // WhatsApp sharing
    whatsapp: {
      schema: 'جدول',
      route: 'الخط',
      noDriversAssigned: 'لا يوجد',
      generatedBy: 'تم إنشاؤه بواسطة',
    }
  },
};
