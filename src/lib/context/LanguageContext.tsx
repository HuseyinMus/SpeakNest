'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';
import { auth, db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

type Language = 'tr' | 'en' | 'es' | 'ar';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: any; // Translation function
  languages: { code: Language; name: string }[];
}

const defaultLanguage: Language = 'tr';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  const languages = [
    { code: 'tr' as Language, name: 'Türkçe' },
    { code: 'en' as Language, name: 'English' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'ar' as Language, name: 'العربية' },
  ];

  // Dil değiştirme fonksiyonu
  const changeLanguage = async (language: Language) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Kullanıcı oturum açmışsa, veritabanında kullanıcının tercih dil ayarını güncelle
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          preferredLanguage: language,
          updatedAt: new Date()
        });
      }
      
      // URL'yi güncelle veya dil parametresini ekle
      const currentPath = window.location.pathname;
      router.push(currentPath);
      
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
    }
  };

  // Kullanıcının tercih ettiği dili kontrol et
  useEffect(() => {
    const checkUserLanguagePreference = async () => {
      // 1. Kimlik doğrulaması yapılmış kullanıcı varsa, onun dil tercihini kontrol et
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().preferredLanguage) {
            const preferredLanguage = userDoc.data().preferredLanguage as Language;
            if (preferredLanguage !== currentLanguage) {
              await changeLanguage(preferredLanguage);
              return;
            }
          }
        } catch (error) {
          console.error('Kullanıcı dil tercihi alınamadı:', error);
        }
      }
      
      // 2. Tarayıcı dil tercihini kontrol et
      const browserLang = navigator.language.split('-')[0];
      const supportedBrowserLang = languages.find(lang => lang.code === browserLang)?.code;
      
      if (supportedBrowserLang && supportedBrowserLang !== currentLanguage) {
        await changeLanguage(supportedBrowserLang);
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