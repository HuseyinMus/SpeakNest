'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Dil türleri için tip tanımı
type Language = 'tr' | 'en' | 'es' | 'ar';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: any) => string; // Translation function
  languages: { code: Language; name: string }[];
}

const defaultLanguage: Language = 'tr';

// Çeviri işlevi - basit bir implementasyon
function translateKey(key: string, language: Language, params?: any): string {
  // Bu fonksiyon, gerçek bir çeviri kütüphanesi eklenene kadar basit bir geçici çözüm olarak işlev görecek
  const translations: Record<Language, Record<string, string>> = {
    tr: {
      'appName': 'İngilizce Pratik Platformu',
      'welcome': 'Hoş Geldiniz',
      'login': 'Giriş Yap',
      'register': 'Kaydol',
      'dashboard': 'Gösterge Paneli',
      'home': 'Ana Sayfa',
      'profile': 'Profil',
      'logout': 'Çıkış Yap',
      'settings': 'Ayarlar',
      'statistics': 'İstatistikler',
      'student': 'Öğrenci',
      'welcomeMessage': 'Hoş geldin, {name}!',
      'todayMessage': 'Bugün İngilizce pratik yapmak için harika bir gün!',
      'findMeeting': 'Oturum Bul',
      'quickMatch': 'Hızlı Eşleşme',
      'upcomingMeetings': 'Yaklaşan Toplantılar',
      'noUpcomingMeetings': 'Yaklaşan toplantınız bulunmamaktadır.',
      'findConversationMeeting': 'Konuşma Oturumu Bul',
      'viewAllUpcomingPractices': 'Tüm Yaklaşan Pratikleri Görüntüle',
      'conversationMeetings': 'Konuşma Oturumları',
      'practiceRooms': 'Pratik Odaları',
      'upcomingPractices': 'Yaklaşan Pratikler',
      'assignments': 'Ödevler',
      'popularPracticeRooms': 'Popüler Pratik Odaları',
      'host': 'Host',
      'notSpecified': 'Belirtilmemiş',
      'joinRoom': 'Odaya Katıl',
      'noPracticeRooms': 'Henüz aktif pratik odası bulunmamaktadır.',
      'viewAllPracticeRooms': 'Tüm Pratik Odalarını Görüntüle',
      // Diğer çeviriler eklenecek
    },
    en: {
      'appName': 'English Practice Platform',
      'welcome': 'Welcome',
      'login': 'Login',
      'register': 'Register',
      'dashboard': 'Dashboard',
      'home': 'Home',
      'profile': 'Profile',
      'logout': 'Logout',
      'settings': 'Settings',
      'statistics': 'Statistics',
      'student': 'Student',
      'welcomeMessage': 'Welcome, {name}!',
      'todayMessage': 'Today is a great day to practice English!',
      'findMeeting': 'Find Session',
      'quickMatch': 'Quick Match',
      'upcomingMeetings': 'Upcoming Meetings',
      'noUpcomingMeetings': 'You have no upcoming meetings.',
      'findConversationMeeting': 'Find Conversation Session',
      'viewAllUpcomingPractices': 'View All Upcoming Practices',
      'conversationMeetings': 'Conversation Sessions',
      'practiceRooms': 'Practice Rooms',
      'upcomingPractices': 'Upcoming Practices',
      'assignments': 'Assignments',
      'popularPracticeRooms': 'Popular Practice Rooms',
      'host': 'Host',
      'notSpecified': 'Not Specified',
      'joinRoom': 'Join Room',
      'noPracticeRooms': 'No active practice rooms available yet.',
      'viewAllPracticeRooms': 'View All Practice Rooms',
      // Diğer çeviriler eklenecek
    },
    es: {
      'appName': 'Plataforma de Práctica de Inglés',
      'welcome': 'Bienvenido',
      'login': 'Iniciar Sesión',
      'register': 'Registrarse',
      'dashboard': 'Panel',
      'home': 'Inicio',
      'profile': 'Perfil',
      'logout': 'Cerrar Sesión',
      'settings': 'Configuración',
      'statistics': 'Estadísticas',
      'student': 'Estudiante',
      'welcomeMessage': '¡Bienvenido, {name}!',
      'todayMessage': '¡Hoy es un gran día para practicar inglés!',
      'findMeeting': 'Buscar Sesión',
      'quickMatch': 'Emparejamiento Rápido',
      'upcomingMeetings': 'Próximas Reuniones',
      'noUpcomingMeetings': 'No tienes reuniones próximas.',
      'findConversationMeeting': 'Buscar Sesión de Conversación',
      'viewAllUpcomingPractices': 'Ver Todas las Prácticas Próximas',
      'conversationMeetings': 'Sesiones de Conversación',
      'practiceRooms': 'Salas de Práctica',
      'upcomingPractices': 'Prácticas Próximas',
      'assignments': 'Tareas',
      'popularPracticeRooms': 'Salas de Práctica Populares',
      'host': 'Anfitrión',
      'notSpecified': 'No Especificado',
      'joinRoom': 'Unirse a la Sala',
      'noPracticeRooms': 'Aún no hay salas de práctica activas disponibles.',
      'viewAllPracticeRooms': 'Ver Todas las Salas de Práctica',
      // Diğer çeviriler eklenecek
    },
    ar: {
      'appName': 'منصة ممارسة اللغة الإنجليزية',
      'welcome': 'مرحبا',
      'login': 'تسجيل الدخول',
      'register': 'التسجيل',
      'dashboard': 'لوحة المعلومات',
      'home': 'الصفحة الرئيسية',
      'profile': 'الملف الشخصي',
      'logout': 'تسجيل الخروج',
      'settings': 'الإعدادات',
      'statistics': 'الإحصائيات',
      'student': 'طالب',
      'welcomeMessage': 'أهلا بك، {name}!',
      'todayMessage': 'اليوم هو يوم رائع لممارسة اللغة الإنجليزية!',
      'findMeeting': 'البحث عن جلسة',
      'quickMatch': 'مطابقة سريعة',
      'upcomingMeetings': 'الاجتماعات القادمة',
      'noUpcomingMeetings': 'ليس لديك اجتماعات قادمة.',
      'findConversationMeeting': 'البحث عن جلسة محادثة',
      'viewAllUpcomingPractices': 'عرض جميع الممارسات القادمة',
      'conversationMeetings': 'جلسات المحادثة',
      'practiceRooms': 'غرف الممارسة',
      'upcomingPractices': 'الممارسات القادمة',
      'assignments': 'الواجبات',
      'popularPracticeRooms': 'غرف الممارسة الشعبية',
      'host': 'مضيف',
      'notSpecified': 'غير محدد',
      'joinRoom': 'انضم إلى الغرفة',
      'noPracticeRooms': 'لا توجد غرف ممارسة نشطة متاحة بعد.',
      'viewAllPracticeRooms': 'عرض جميع غرف الممارسة',
      // Diğer çeviriler eklenecek
    }
  };

  // Anahtar için çeviri varsa döndür, yoksa anahtarın kendisini döndür
  if (params) {
    let translatedText = translations[language][key] || key;
    // Parametreleri işleme
    Object.keys(params).forEach(paramKey => {
      translatedText = translatedText.replace(`{${paramKey}}`, params[paramKey]);
    });
    return translatedText;
  }
  
  return translations[language][key] || key;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  const languages = [
    { code: 'tr' as Language, name: 'Türkçe' },
    { code: 'en' as Language, name: 'English' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'ar' as Language, name: 'العربية' },
  ];

  // Çeviri fonksiyonu
  const t = (key: string, params?: any): string => {
    return translateKey(key, currentLanguage, params);
  };

  // Dil değiştirme fonksiyonu
  const changeLanguage = async (language: Language) => {
    try {
      setCurrentLanguage(language);
      
      // Dil tercihini localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLanguage', language);
      }
      
      // Kullanıcı oturum açmışsa, veritabanında kullanıcının tercih dil ayarını güncelle
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          preferredLanguage: language,
          updatedAt: new Date()
        });
      }
      
      // URL'yi güncelle veya yeniden yönlendir
      if (pathname) {
        router.refresh(); // Sayfayı yenile
      }
      
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
    }
  };

  // Kullanıcının tercih ettiği dili kontrol et
  useEffect(() => {
    const checkUserLanguagePreference = async () => {
      let preferredLanguage: Language | null = null;
      
      // 1. Önce localStorage'dan kontrol et
      if (typeof window !== 'undefined') {
        const storedLanguage = localStorage.getItem('preferredLanguage') as Language | null;
        if (storedLanguage && languages.find(lang => lang.code === storedLanguage)) {
          preferredLanguage = storedLanguage;
        }
      }
      
      // 2. localStorage'da yoksa, kimlik doğrulaması yapılmış kullanıcı varsa onun dil tercihini kontrol et
      if (!preferredLanguage) {
        const user = auth.currentUser;
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().preferredLanguage) {
              preferredLanguage = userDoc.data().preferredLanguage as Language;
            }
          } catch (error) {
            console.error('Kullanıcı dil tercihi alınamadı:', error);
          }
        }
      }
      
      // 3. Hala bir dil belirlenmediyse tarayıcı dilini kontrol et
      if (!preferredLanguage) {
        const browserLang = navigator.language.split('-')[0];
        const supportedBrowserLang = languages.find(lang => lang.code === browserLang)?.code;
        
        if (supportedBrowserLang) {
          preferredLanguage = supportedBrowserLang;
        }
      }
      
      // Eğer bir dil belirlediyse ve mevcut dilden farklıysa değiştir
      if (preferredLanguage && preferredLanguage !== currentLanguage) {
        setCurrentLanguage(preferredLanguage);
      }
    };
    
    checkUserLanguagePreference();
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 