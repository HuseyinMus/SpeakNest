'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, Calendar, CheckSquare } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ProUserPanel() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeMeetings, setActiveMeetings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUser(user);
            await fetchUserProfile(user.uid);
          } else {
            // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Auth kontrolü sırasında hata:', err);
        setError(t('sessionCheckError', 'Toplantı kontrolü sırasında bir hata oluştu.'));
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Kullanıcı profilini getir
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        
        // Kullanıcı proUser değilse yönlendir
        if (userData.role !== 'proUser') {
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'teacher') {
            router.push('/teacher-panel');
          } else if (userData.role === 'student') {
            router.push('/student-panel');
          } else {
            router.push('/');
          }
          return;
        }
        
        // Aktif toplantıları getir
        await fetchMeetingData(userId);
      } else {
        setError(t('userProfileNotFound'));
      }
    } catch (err) {
      console.error('Profil verisi alınamadı:', err);
      setError(t('profileDataError'));
    }
  };
  
  // Toplantı verilerini getir
  const fetchMeetingData = async (userId: string) => {
    try {
      console.log('ProUser ID:', userId);
      
      // Kullanıcı proUser olsa bile, boş data göster (meetings koleksiyonu hazır olmayabilir)
      setActiveMeetings([]);
      
      // Aktif toplantıları getir - şu an devre dışı bırakıyoruz, meetings koleksiyonu hazır olmadığı için
      /* 
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('hostId', '==', userId),
        where('status', '==', 'active'),
        orderBy('startTime', 'asc')
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData: any[] = [];
      
      meetingsSnapshot.forEach((doc) => {
        meetingsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setActiveMeetings(meetingsData);
      */
      
    } catch (err) {
      console.error('Toplantı verileri alınamadı:', err);
      // Hata mesajını daha kullanıcı dostu hale getir
      if (err.code === 'permission-denied') {
        console.log('Yetki hatası: Meetings koleksiyonuna erişim izni yok');
        setError(t('meetingsAccessError'));
      } else {
        setError(t('meetingsDataError'));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-sm">
          <div className="w-10 h-10 rounded-full border-2 border-t-slate-500 border-b-slate-300 border-l-transparent border-r-transparent animate-spin mb-4"></div>
          <div className="text-lg font-medium text-slate-700">{t('loading')}</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-red-600">{t('error')}</h2>
          <p className="text-slate-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            {t('returnToLogin')}
          </button>
        </div>
      </div>
    );
  }
  
  // Menü öğeleri - ProUser için özelleştirilmiş
  const menuItems = [
    { id: 'dashboard', label: t('home'), icon: <Home size={18} /> },
    { id: 'my-meetings', label: t('myMeetings'), icon: <Calendar size={18} /> },
    { id: 'create-meeting', label: t('createMeeting'), icon: <MessageCircle size={18} /> },
    { id: 'participants', label: t('participants'), icon: <Users size={18} /> },
    { id: 'evaluations', label: t('evaluations'), icon: <CheckSquare size={18} /> },
    { id: 'profile', label: t('profile'), icon: <User size={18} /> },
    { id: 'statistics', label: t('statistics'), icon: <BarChart size={18} /> },
    { id: 'settings', label: t('settings'), icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobil menü butonu */}
      <div className="bg-white p-4 flex justify-between items-center md:hidden border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-slate-800">{t('appName')}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Yan menü */}
        <div className={`bg-white border-r shadow-sm fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 pb-2">
              {userProfile?.photoURL ? (
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || t('profile')}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="font-medium text-slate-800">
                  {userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || t('conversationHost')}
                </div>
                <div className="text-xs text-slate-500">
                  {userProfile?.role === 'proUser' ? t('conversationHost') : userProfile?.role}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 w-full py-2 px-3 rounded-md text-sm ${
                      activeTab === item.id 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-2 px-3 rounded-md text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </li>
            </ul>
            
            <div className="mt-6 px-3 py-4 border-t pt-4">
              <p className="text-xs text-slate-500 mb-2">{t('selectLanguage')}</p>
              <LanguageSwitcher variant="select" className="w-full" />
            </div>
          </div>
        </div>
        
        {/* Ana içerik alanı */}
        <div className="flex-1 p-4 md:p-6 md:pt-6 overflow-auto">
          <div className="hidden md:flex md:justify-between md:items-center mb-6">
            <h1 className="text-xl font-semibold text-slate-800">
              {menuItems.find(item => item.id === activeTab)?.label || t('appName')}
            </h1>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
  
  // Ana içerik renderlaması
  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Hoş geldin kartı */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-md p-6 border border-teal-400">
              <h2 className="text-xl font-semibold text-white mb-2">{t('welcomeMessage', { name: userProfile?.displayName || userProfile?.firstName || t('conversationHost') })}</h2>
              <p className="text-white opacity-90">{t('hostDayMessage')}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button 
                  onClick={() => setActiveTab('create-meeting')}
                  className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-700 rounded-md transition-colors text-sm font-medium shadow-sm"
                >
                  {t('createNewMeeting')}
                </button>
                <button 
                  onClick={() => setActiveTab('participants')}
                  className="px-4 py-2 bg-teal-700 bg-opacity-30 hover:bg-opacity-40 text-white rounded-md transition-colors text-sm font-medium shadow-sm border border-teal-400"
                >
                  {t('viewParticipants')}
                </button>
              </div>
            </div>
            
            {/* Aktif Toplantılarım */}
            <div className="bg-white rounded-lg shadow-md border border-teal-100 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-3">
                <h2 className="text-base font-medium text-white">{t('activeMeetings')}</h2>
              </div>
              <div className="p-6">
                {activeMeetings.length > 0 ? (
                  <div className="grid gap-4">
                    {activeMeetings.map((meeting) => (
                      <div key={meeting.id} className="border border-slate-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
                        <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{meeting.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                            {meeting.level || t('intermediateLevel')}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {meeting.topic || t('dailyConversation')}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {meeting.participants?.length || 0}/{meeting.capacity || 8} {t('participants')}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {t('date')}: {meeting.startTime?.toDate().toLocaleDateString() || t('notSpecified')}, 
                            {meeting.startTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          </span>
                          <button 
                            className="text-sm px-3 py-1.5 rounded-md bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                            onClick={() => router.push(`/meetings/${meeting.id}`)}
                          >
                            {t('goToMeeting')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-md bg-slate-50">
                    <p className="text-slate-600">{t('noActiveMeetings')}</p>
                    <button 
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-md hover:from-teal-700 hover:to-emerald-600 transition-colors text-sm shadow-sm"
                      onClick={() => setActiveTab('create-meeting')}
                    >
                      {t('createNewMeeting')}
                    </button>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
                    onClick={() => setActiveTab('my-meetings')}
                  >
                    {t('viewAllMeetings')} →
                  </button>
                </div>
              </div>
            </div>
            
            {/* Yaklaşan Toplantılar */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-700 px-6 py-3">
                <h2 className="text-base font-medium text-white">{t('upcomingMeetings')}</h2>
              </div>
              <div className="p-6">
                <div className="text-center py-8 rounded-md bg-slate-50">
                  <p className="text-slate-600">{t('noUpcomingMeetingsScheduled')}</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors text-sm shadow-sm"
                    onClick={() => setActiveTab('create-meeting')}
                  >
                    {t('scheduleMeeting')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // Diğer tab içerikleri buraya eklenecek
      
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden p-6 text-center">
            <p className="text-slate-600">{t('sectionComingSoon')}</p>
          </div>
        );
    }
  }
} 