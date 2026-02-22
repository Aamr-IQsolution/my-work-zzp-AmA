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
    addToHomeScreen: 'تثبيت التطبيق', // Changed text for clarity
    close: 'إغلاق',
  },

  // PWA Install Instructions
  pwa: {
    installTitle: 'تثبيت التطبيق',
    installInstructionsAndroid: 'لتثبيت التطبيق، اضغط على قائمة المتصفح (⋮) ثم اختر \'تثبيت التطبيق\' أو \'إضافة إلى الشاشة الرئيسية\'.',
    installInstructionsDesktop: 'لتثبيت التطبيق على جهاز الكمبيوتر، ابحث عن أيقونة التثبيت (عادةً شاشة بها سهم لأسفل) في شريط عنوان المتصفح.',
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

  // UpdatePassword.tsx
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

  // UserManagement
  userManagement: {
    title: 'إدارة المستخدمين',
    loadingUsers: 'جاري تحميل المستخدمين...',
    errorOccurred: 'حدث خطأ',
    errorHint: 'تأكد من أن دالة Supabase تم نشرها وأن سياسات RLS صحيحة.',
    user: 'مستخدم',
    admin: 'مسؤول',
    you: 'أنت',
    changePassword: 'تغيير كلمة المرور',
    cannotChangeOwnRole: 'لا يمكنك تغيير دورك الخاص.',
    
    updatePasswordModal: {
      title: 'تحديث كلمة المرور',
      newPasswordPlaceholder: 'كلمة المرور الجديدة',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين!',
      passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
      updateSuccess: 'تم تحديث كلمة المرور بنجاح!',
      updateError: 'فشل تحديث كلمة المرور.',
      updating: 'جاري التحديث...',
    }
  },

  // ScheduleApp
  scheduleApp: {
    headerTitle: 'نظام جدولة السائقين',
    manageUsers: 'المستخدمون',
    today: 'اليوم',
    userRole: 'مستخدم',
    adminRole: 'مسؤول',
    addDriver: 'إضافة سائق',
    driverNamePlaceholder: 'الاسم...',
    drivers: 'السائقون',
    noDrivers: 'لا يوجد سائقون',
    week: 'أسبوع',
    newTableDefault: 'جدول',
    tableName: 'اسم الجدول',
    routeInfo: 'معلومات المسار',
    day: 'اليوم',
    morning: 'صباحاً',
    evening: 'مساءً',
    assign: '+ تعيين',
    noTableSelected: 'لم يتم تحديد جدول',
    selectOrAddTable: 'حدد جدولاً أو أضف جدولاً جديداً.',
    addTable: 'إضافة جدول جديد',
    selectDrivers: 'اختر السائقين',
    addDriverFirst: 'أضف سائقاً أولاً',
    
    whatsapp: {
      schema: 'الجدول',
      route: 'المسار',
      noDriversAssigned: 'لا يوجد',
      generatedBy: 'تم إنشاؤه بواسطة',
    }
  },
};