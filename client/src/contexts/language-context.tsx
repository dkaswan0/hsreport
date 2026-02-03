import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.dashboard': { ar: 'الرئيسية', en: 'Dashboard' },
  'nav.inspections': { ar: 'الفحوصات', en: 'Inspections' },
  'nav.faultLibrary': { ar: 'الأعطال', en: 'Fault Library' },
  'nav.vehicleData': { ar: 'بيانات السيارة', en: 'Vehicle Data' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Logout' },

  // Dashboard
  'dashboard.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'dashboard.welcome': { ar: 'مرحباً بك', en: 'Welcome' },
  'dashboard.totalInspections': { ar: 'إجمالي الفحوصات', en: 'Total Inspections' },
  'dashboard.todayInspections': { ar: 'فحوصات اليوم', en: 'Today\'s Inspections' },
  'dashboard.recentInspections': { ar: 'آخر الفحوصات', en: 'Recent Inspections' },
  'dashboard.newInspection': { ar: 'فحص جديد', en: 'New Inspection' },
  'dashboard.viewAll': { ar: 'عرض الكل', en: 'View All' },

  // Inspections
  'inspections.title': { ar: 'الفحوصات', en: 'Inspections' },
  'inspections.new': { ar: 'فحص جديد', en: 'New Inspection' },
  'inspections.search': { ar: 'ابحث عن فحص...', en: 'Search inspections...' },
  'inspections.noResults': { ar: 'لا توجد نتائج', en: 'No results found' },
  'inspections.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'inspections.view': { ar: 'عرض', en: 'View' },
  'inspections.edit': { ar: 'تعديل', en: 'Edit' },
  'inspections.delete': { ar: 'حذف', en: 'Delete' },
  'inspections.report': { ar: 'التقرير', en: 'Report' },

  // New Inspection
  'newInspection.title': { ar: 'فحص جديد', en: 'New Inspection' },
  'newInspection.vehicleInfo': { ar: 'معلومات السيارة', en: 'Vehicle Information' },
  'newInspection.customerInfo': { ar: 'معلومات العميل', en: 'Customer Information' },
  'newInspection.vin': { ar: 'رقم الهيكل (VIN)', en: 'VIN Number' },
  'newInspection.make': { ar: 'الشركة المصنعة', en: 'Make' },
  'newInspection.model': { ar: 'الموديل', en: 'Model' },
  'newInspection.year': { ar: 'السنة', en: 'Year' },
  'newInspection.color': { ar: 'اللون', en: 'Color' },
  'newInspection.odometer': { ar: 'عداد الكيلومترات', en: 'Odometer' },
  'newInspection.customerName': { ar: 'اسم العميل', en: 'Customer Name' },
  'newInspection.customerPhone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'newInspection.inspectionType': { ar: 'نوع الفحص', en: 'Inspection Type' },
  'newInspection.start': { ar: 'بدء الفحص', en: 'Start Inspection' },
  'newInspection.scanVin': { ar: 'مسح VIN', en: 'Scan VIN' },
  'newInspection.decodeVin': { ar: 'فك الترميز', en: 'Decode VIN' },

  // Inspection Details
  'inspection.addFault': { ar: 'إضافة عطل', en: 'Add Fault' },
  'inspection.selectFault': { ar: 'اختر العطل', en: 'Select Fault' },
  'inspection.searchFault': { ar: 'ابحث عن العطل...', en: 'Search for fault...' },
  'inspection.status': { ar: 'الحالة', en: 'Status' },
  'inspection.pass': { ar: 'جيد', en: 'Pass' },
  'inspection.warning': { ar: 'تنبيه', en: 'Warning' },
  'inspection.fail': { ar: 'معيب', en: 'Fail' },
  'inspection.details': { ar: 'التفاصيل', en: 'Details' },
  'inspection.photo': { ar: 'صورة العطل', en: 'Fault Photo' },
  'inspection.takePhoto': { ar: 'التقاط صورة', en: 'Take Photo' },
  'inspection.save': { ar: 'حفظ', en: 'Save' },
  'inspection.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'inspection.faults': { ar: 'الأعطال', en: 'Faults' },
  'inspection.noFaults': { ar: 'لا توجد أعطال', en: 'No faults recorded' },
  'inspection.selected': { ar: 'تم الاختيار', en: 'Selected' },
  'inspection.editHere': { ar: 'يمكنك التحرير', en: 'You can edit' },
  'inspection.editFaultName': { ar: 'العطل المختار - اضغط للتحرير:', en: 'Selected Fault - Click to edit:' },
  'inspection.editHint': { ar: 'يمكنك تعديل النص أعلاه - إضافة أو حذف كلمات', en: 'You can edit the text above - add or remove words' },

  // Fault Library
  'faultLibrary.title': { ar: 'مكتبة الأعطال', en: 'Fault Library' },
  'faultLibrary.search': { ar: 'ابحث عن عطل...', en: 'Search faults...' },
  'faultLibrary.all': { ar: 'الكل', en: 'All' },
  'faultLibrary.critical': { ar: 'حرج', en: 'Critical' },
  'faultLibrary.high': { ar: 'خطير', en: 'High' },
  'faultLibrary.medium': { ar: 'متوسط', en: 'Medium' },
  'faultLibrary.low': { ar: 'بسيط', en: 'Low' },
  'faultLibrary.noFaults': { ar: 'لا توجد أعطال', en: 'No faults found' },
  'faultLibrary.total': { ar: 'إجمالي الأعطال', en: 'Total Faults' },

  // Interactive Report
  'report.title': { ar: 'تقرير الفحص', en: 'Inspection Report' },
  'report.print': { ar: 'طباعة', en: 'Print' },
  'report.download': { ar: 'تحميل PDF', en: 'Download PDF' },
  'report.share': { ar: 'مشاركة', en: 'Share' },
  'report.vehicleInfo': { ar: 'معلومات السيارة', en: 'Vehicle Information' },
  'report.inspectionSummary': { ar: 'ملخص الفحص', en: 'Inspection Summary' },
  'report.faultsList': { ar: 'قائمة الأعطال', en: 'Faults List' },
  'report.passed': { ar: 'ناجح', en: 'Passed' },
  'report.warnings': { ar: 'تنبيهات', en: 'Warnings' },
  'report.failed': { ar: 'فاشل', en: 'Failed' },
  'report.totalItems': { ar: 'إجمالي البنود', en: 'Total Items' },
  'report.back': { ar: 'رجوع', en: 'Back' },

  // Categories
  'category.mechanic': { ar: 'الأجزاء الميكانيكية', en: 'Mechanical Parts' },
  'category.transmission': { ar: 'ناقل الحركة', en: 'Transmission' },
  'category.body': { ar: 'الهيكل الخارجي', en: 'Body' },
  'category.chassis': { ar: 'الشاسيه', en: 'Chassis' },
  'category.electric': { ar: 'الكهربائية', en: 'Electrical' },
  'category.interior': { ar: 'الداخلية والسلامة', en: 'Interior & Safety' },
  'category.engine': { ar: 'المحرك', en: 'Engine' },
  'category.brakes': { ar: 'الفرامل', en: 'Brakes' },
  'category.suspension': { ar: 'نظام التعليق', en: 'Suspension' },
  'category.steering': { ar: 'نظام التوجيه', en: 'Steering' },
  'category.tires': { ar: 'الإطارات', en: 'Tires' },
  'category.lights': { ar: 'الإضاءة', en: 'Lights' },
  'category.ac': { ar: 'التكييف', en: 'A/C' },
  'category.fuel': { ar: 'الوقود والعادم', en: 'Fuel & Exhaust' },

  // Common
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.delete': { ar: 'حذف', en: 'Delete' },
  'common.edit': { ar: 'تعديل', en: 'Edit' },
  'common.add': { ar: 'إضافة', en: 'Add' },
  'common.search': { ar: 'بحث', en: 'Search' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.error': { ar: 'حدث خطأ', en: 'An error occurred' },
  'common.success': { ar: 'تم بنجاح', en: 'Success' },
  'common.confirm': { ar: 'تأكيد', en: 'Confirm' },
  'common.yes': { ar: 'نعم', en: 'Yes' },
  'common.no': { ar: 'لا', en: 'No' },
  'common.close': { ar: 'إغلاق', en: 'Close' },
  'common.back': { ar: 'رجوع', en: 'Back' },
  'common.next': { ar: 'التالي', en: 'Next' },
  'common.previous': { ar: 'السابق', en: 'Previous' },
  'common.km': { ar: 'كم', en: 'km' },

  // Settings
  'settings.title': { ar: 'الإعدادات', en: 'Settings' },
  'settings.addFault': { ar: 'إضافة عطل جديد', en: 'Add New Fault' },
  'settings.category': { ar: 'القسم', en: 'Category' },
  'settings.faultNameAr': { ar: 'اسم العطل بالعربية', en: 'Fault Name (Arabic)' },
  'settings.faultNameEn': { ar: 'اسم العطل بالإنجليزية', en: 'Fault Name (English)' },
  'settings.severity': { ar: 'الخطورة', en: 'Severity' },
  'settings.description': { ar: 'الوصف', en: 'Description' },

  // Login
  'login.title': { ar: 'نظام فحص المركبات', en: 'Vehicle Inspection System' },
  'login.username': { ar: 'اسم المستخدم', en: 'Username' },
  'login.password': { ar: 'كلمة المرور', en: 'Password' },
  'login.submit': { ar: 'تسجيل الدخول', en: 'Login' },
  'login.error': { ar: 'اسم المستخدم أو كلمة المرور غير صحيحة', en: 'Invalid username or password' },
  'login.logging': { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-language');
      return (saved as Language) || 'ar';
    }
    return 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app-language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[lang];
  };

  const isRTL = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
