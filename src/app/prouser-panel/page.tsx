'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, Calendar, CheckSquare, Plus, MinusCircle } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useToast } from '@/lib/context/ToastContext';
import { Shimmer, ShimmerCard, ShimmerList } from '@/components/ui/Shimmer';

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
  const toast = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
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
      
    } catch (err: any) {
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
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-slate-50">
        {/* Shimmer yükleme efekti */}
        <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-emerald-500">
          <Shimmer className="w-3/4" height="1.75rem" />
          <Shimmer className="w-1/2 mt-2" height="1rem" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShimmerCard rows={2} />
          <ShimmerCard rows={1} />
        </div>
        
        <ShimmerList items={3} />
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
      
      case 'create-meeting':
        return <CreateMeetingForm userId={user?.uid} userProfile={userProfile} />;
      
      case 'my-meetings':
        // Toplantılarım sekmesi için Shimmer efekti ile geçici içerik
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-slate-800">{t('myMeetings')}</h2>
              <p className="text-slate-600 mt-1">{t('myMeetingsDescription', 'Oluşturduğunuz ve katıldığınız tüm toplantıları görüntüleyin.')}</p>
            </div>
            
            <ShimmerList items={5} />
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

// Toplantı Formu için tip tanımları
interface MeetingFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  level: string;
  topic: string;
  participantCount: number;
  keywords: string[];
  questions: string[];
  isSubmitting: boolean;
  error: string;
  success: string;
}

interface CreateMeetingFormProps {
  userId: string | undefined;
  userProfile: any;
}

// Toplantı Oluşturma Formu Bileşeni
function CreateMeetingForm({ userId, userProfile }: CreateMeetingFormProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  
  // Form State
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    level: 'intermediate', // Default: Orta Seviye
    topic: 'daily', // Default: Günlük Konuşma
    participantCount: 6, // Default: 6 katılımcı
    keywords: [],
    questions: [],
    isSubmitting: false,
    error: '',
    success: ''
  });
  
  // Anahtar kelimeler için state
  const [currentKeyword, setCurrentKeyword] = useState('');
  
  // Konu soruları için state
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  // Form verisini güncelleme fonksiyonu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Anahtar kelime ekleme işlevi
  const addKeyword = () => {
    if (currentKeyword.trim() && !formData.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };
  
  // Anahtar kelime silme işlevi
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  // Soru ekleme işlevi
  const addQuestion = () => {
    if (currentQuestion.trim() && !formData.questions.includes(currentQuestion.trim())) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, currentQuestion.trim()]
      }));
      setCurrentQuestion('');
    }
  };
  
  // Soru silme işlevi
  const removeQuestion = (question: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q !== question)
    }));
  };
  
  // Form gönderme işlevi
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setFormData(prev => ({ ...prev, isSubmitting: true, error: '' }));
      
      // Form validasyonu
      if (!formData.title.trim()) {
        const errorMsg = t('titleRequired', 'Başlık alanı zorunludur.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.date || !formData.time) {
        const errorMsg = t('dateTimeRequired', 'Tarih ve saat seçimi zorunludur.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Tarih bilgisini oluşturma
      const meetingDateTime = new Date(`${formData.date}T${formData.time}`);
      
      if (meetingDateTime < new Date()) {
        const errorMsg = t('futureDateRequired', 'Toplantı tarihi gelecekte olmalıdır.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Katılımcı sayısı doğrulama
      if (formData.participantCount < 3 || formData.participantCount > 6) {
        const errorMsg = t('participantCountError', 'Katılımcı sayısı 3 ile 6 arasında olmalıdır.');
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Firestore'a toplantı bilgilerini ekle
      const meetingData = {
        title: formData.title,
        description: formData.description,
        startTime: meetingDateTime,
        level: formData.level,
        topic: formData.topic,
        participantCount: formData.participantCount,
        keywords: formData.keywords,
        questions: formData.questions,
        hostId: userId,
        hostName: userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}`,
        hostPhotoURL: userProfile?.photoURL || null,
        status: 'active',
        participants: [],
        meetUrl: '', // Google Meet API ile daha sonra eklenecek
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Meetings koleksiyonuna ekle
      const docRef = await addDoc(collection(db, 'meetings'), meetingData);
      
      // Başarılı mesajı göster
      const successMsg = t('meetingCreateSuccess', 'Toplantı başarıyla oluşturuldu!');
      toast.success(successMsg);
      
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        level: 'intermediate',
        topic: 'daily',
        participantCount: 6,
        keywords: [],
        questions: [],
        isSubmitting: false,
        error: '',
        success: successMsg
      });
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setFormData(prev => ({ ...prev, success: '' }));
      }, 3000);
      
    } catch (error: any) { // Hata tipini any olarak belirterek TypeScript hatasını gideriyoruz
      console.error('Toplantı oluşturulurken hata:', error);
      const errorMsg = error.message || t('meetingCreateError', 'Toplantı oluşturulurken bir hata oluştu.');
      
      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMsg
      }));
    }
  };
  
  // Konu seçenekleri
  const topicOptions = [
    { value: 'daily', label: t('dailyConversation', 'Günlük Konuşma') },
    { value: 'business', label: t('business', 'İş Dünyası') },
    { value: 'education', label: t('education', 'Eğitim/Okul') },
    { value: 'science', label: t('science', 'Bilim') },
    { value: 'technology', label: t('technology', 'Teknoloji') },
    { value: 'arts', label: t('arts', 'Sanat ve Kültür') },
    { value: 'travel', label: t('travel', 'Seyahat') },
    { value: 'food', label: t('food', 'Yemek ve Mutfak') },
    { value: 'sports', label: t('sports', 'Spor') },
    { value: 'health', label: t('health', 'Sağlık ve Wellness') },
    { value: 'environment', label: t('environment', 'Çevre') },
    { value: 'entertainment', label: t('entertainment', 'Eğlence ve Hobiler') },
  ];
  
  // Seviye seçenekleri
  const levelOptions = [
    { value: 'beginner', label: t('beginnerLevel', 'Başlangıç Seviyesi') },
    { value: 'intermediate', label: t('intermediateLevel', 'Orta Seviye') },
    { value: 'advanced', label: t('advancedLevel', 'İleri Seviye') },
    { value: 'any', label: t('anyLevel', 'Tüm Seviyeler') },
  ];
  
  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-emerald-500">
        <h2 className="text-xl font-semibold text-slate-800">{t('createMeeting')}</h2>
        <p className="text-slate-600 mt-1">{t('createMeetingDescription', 'Yeni bir İngilizce pratik toplantısı oluşturun ve konuşma sunucusu olarak katılımcılara yardımcı olun.')}</p>
      </div>
      
      {/* Form */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Başlık ve Açıklama */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                {t('meetingTitle', 'Toplantı Başlığı')} *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('meetingTitlePlaceholder', 'Örn: Günlük Konuşma Pratiği')}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                {t('meetingDescription', 'Toplantı Açıklaması')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('meetingDescriptionPlaceholder', 'Bu toplantıda neler konuşulacak?')}
              />
            </div>
          </div>
          
          {/* Tarih, Saat, Seviye ve Konu */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                  {t('meetingDate', 'Toplantı Tarihi')} *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  min={new Date().toISOString().split('T')[0]} // Bugün ve sonrası için
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700 mb-1">
                  {t('meetingTime', 'Toplantı Saati')} *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1">
                  {t('level', 'Seviye')}
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {levelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
                  {t('topic', 'Konu')}
                </label>
                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {topicOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Katılımcı Sayısı - Tek alana dönüştürüldü */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="participantCount" className="block text-sm font-medium text-slate-700 mb-1">
                {t('participantCount', 'Katılımcı Sayısı')}
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="participantCount"
                  name="participantCount"
                  value={formData.participantCount}
                  onChange={handleChange}
                  min="3"
                  max="6"
                  className="w-full mr-3 accent-emerald-500"
                />
                <span className="text-lg font-medium text-slate-700 min-w-[30px] text-center">
                  {formData.participantCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{t('participantCountHelp', 'Toplantıya katılabilecek kişi sayısı (3-6 arası)')}</p>
            </div>
          </div>
          
          {/* Anahtar Kelimeler */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('keywords', 'Anahtar Kelimeler')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('keywordPlaceholder', 'Yeni anahtar kelime ekle')}
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5 text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-emerald-600 hover:text-emerald-800 focus:outline-none"
                    >
                      <MinusCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Konu Soruları */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('topicQuestions', 'Konu Soruları')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('questionPlaceholder', 'Toplantıda sorulacak bir soru ekle')}
              />
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {formData.questions.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.questions.map((question, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-slate-100 text-slate-800 rounded-md flex items-center justify-between text-sm"
                  >
                    <span>{question}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question)}
                      className="text-slate-600 hover:text-red-600 focus:outline-none"
                    >
                      <MinusCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Hata/Başarı Mesajları */}
          {formData.error && (
            <div className="px-4 py-3 bg-red-100 text-red-800 rounded-md">
              {formData.error}
            </div>
          )}
          
          {formData.success && (
            <div className="px-4 py-3 bg-green-100 text-green-800 rounded-md">
              {formData.success}
            </div>
          )}
          
          {/* Gönderme Butonu */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={formData.isSubmitting}
              className={`w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-md font-medium shadow-sm hover:from-teal-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${formData.isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {formData.isSubmitting ? t('creating', 'Oluşturuluyor...') : t('createMeeting', 'Toplantı Oluştur')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 