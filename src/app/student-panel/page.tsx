'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, Book, FileText, User, LogOut, BarChart, Calendar, Settings } from 'lucide-react';

export default function StudentPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
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
        setError('Oturum kontrolü sırasında bir hata oluştu.');
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
        
        // Kullanıcı öğrenci değilse yönlendir
        if (userData.role !== 'student') {
          if (userData.role === 'admin') {
            router.push('/dashboard');
          } else if (userData.role === 'teacher') {
            router.push('/teacher-panel');
          } else {
            router.push('/');
          }
          return;
        }
        
        // Kurslar ve ödevleri getir
        await fetchStudentData(userId);
      } else {
        setError('Kullanıcı profili bulunamadı.');
      }
    } catch (err) {
      console.error('Profil verisi alınamadı:', err);
      setError('Profil bilgileri alınırken bir hata oluştu.');
    }
  };
  
  // Öğrenci verilerini getir (kurslar, ödevler)
  const fetchStudentData = async (userId: string) => {
    try {
      // Aktif kursları getir
      const coursesQuery = query(
        collection(db, 'courses'),
        where('students', 'array-contains', userId),
        where('isActive', '==', true)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData: any[] = [];
      
      coursesSnapshot.forEach((doc) => {
        coursesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setActiveCourses(coursesData);
      
      // Bekleyen ödevleri getir
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('studentId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('dueDate', 'asc'),
        limit(5)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData: any[] = [];
      
      assignmentsSnapshot.forEach((doc) => {
        assignmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingAssignments(assignmentsData);
      
    } catch (err) {
      console.error('Öğrenci verileri alınamadı:', err);
      setError('Kurs ve ödev bilgileri alınırken bir hata oluştu.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center p-8 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm shadow-xl">
          <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-purple-500 border-l-transparent border-r-transparent animate-spin mb-4"></div>
          <div className="text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Yükleniyor...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-red-50">
        <div className="bg-white border border-red-100 text-red-700 px-6 py-5 rounded-xl max-w-md shadow-lg">
          <h2 className="text-xl font-semibold mb-3 text-red-600">Hata</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:from-red-600 hover:to-pink-600 transform transition-all duration-200 hover:shadow-lg"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }
  
  // Menü öğeleri
  const menuItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <Home size={20} /> },
    { id: 'courses', label: 'Kurslarım', icon: <Book size={20} /> },
    { id: 'assignments', label: 'Ödevlerim', icon: <FileText size={20} /> },
    { id: 'profile', label: 'Profilim', icon: <User size={20} /> },
    { id: 'statistics', label: 'İstatistikler', icon: <BarChart size={20} /> },
    { id: 'calendar', label: 'Takvim', icon: <Calendar size={20} /> },
    { id: 'settings', label: 'Ayarlar', icon: <Settings size={20} /> },
  ];

  // Ana içerik renderlaması
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Hoş geldin kartı */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Hoş Geldin, {userProfile?.displayName || userProfile?.firstName || 'Öğrenci'}</h2>
              <p className="opacity-90">Bugün harika şeyler öğrenmeye hazır mısın?</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg backdrop-blur-sm transition-all duration-200">
                  Hızlı Erişim
                </button>
                <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg backdrop-blur-sm transition-all duration-200">
                  Yardım Al
                </button>
              </div>
            </div>
            
            {/* Aktif Kurslar */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Aktif Kurslarım</h2>
              </div>
              <div className="p-6">
                {activeCourses.length > 0 ? (
                  <div className="grid gap-4">
                    {activeCourses.map((course) => (
                      <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                        <h3 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{course.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Eğitmen: {course.instructorName || 'Belirtilmemiş'}
                          </span>
                          <button 
                            className="text-sm px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transform transition-all duration-200 hover:scale-105"
                            onClick={() => router.push(`/courses/${course.id}`)}
                          >
                            Kursa Git
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-lg bg-gray-50">
                    <p className="text-gray-500">Henüz aktif kursunuz bulunmamaktadır.</p>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200"
                    onClick={() => setActiveTab('courses')}
                  >
                    Tüm Kursları Görüntüle →
                  </button>
                </div>
              </div>
            </div>
            
            {/* Bekleyen Ödevler */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Bekleyen Ödevlerim</h2>
              </div>
              <div className="p-6">
                {pendingAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAssignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{assignment.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                            <span className="text-sm text-gray-500 block mt-2">
                              Kurs: {assignment.courseName || 'Belirtilmemiş'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium ${
                              new Date(assignment.dueDate.seconds * 1000) < new Date() 
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white'
                            }`}>
                              Teslim: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button 
                            className="text-sm px-4 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transform transition-all duration-200 hover:scale-105"
                            onClick={() => router.push(`/assignments/${assignment.id}`)}
                          >
                            Ödevi Görüntüle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-lg bg-gray-50">
                    <p className="text-gray-500">Bekleyen ödeviniz bulunmamaktadır.</p>
                  </div>
                )}
                
                <div className="mt-4 text-right">
                  <button 
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors duration-200"
                    onClick={() => setActiveTab('assignments')}
                  >
                    Tüm Ödevleri Görüntüle →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Tüm Kurslarım</h2>
            </div>
            <div className="p-6">
              {activeCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                      <h3 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Eğitmen: {course.instructorName || 'Belirtilmemiş'}
                        </span>
                        <button 
                          className="text-sm px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transform transition-all duration-200 hover:scale-105"
                          onClick={() => router.push(`/courses/${course.id}`)}
                        >
                          Kursa Git
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Henüz aktif kursunuz bulunmamaktadır.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Tüm Ödevlerim</h2>
            </div>
            <div className="p-6">
              {pendingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{assignment.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                          <span className="text-sm text-gray-500 block mt-2">
                            Kurs: {assignment.courseName || 'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium ${
                            new Date(assignment.dueDate.seconds * 1000) < new Date() 
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white'
                          }`}>
                            Teslim: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button 
                          className="text-sm px-4 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transform transition-all duration-200 hover:scale-105"
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                        >
                          Ödevi Görüntüle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-lg bg-gray-50">
                  <p className="text-gray-500">Bekleyen ödeviniz bulunmamaktadır.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Profil Bilgilerim</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-gradient-to-r from-emerald-300 to-teal-300 shadow-lg">
                  {userProfile?.photoURL ? (
                    <Image 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName || 'Profil Fotoğrafı'} 
                      className="object-cover"
                      fill
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-3xl font-bold">
                      {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || 'Öğrenci'}</h2>
                <p className="text-gray-500 mt-1">{userProfile?.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm">
                  {userProfile?.role}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kayıt Tarihi:</span>
                  <span className="font-medium">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Son Giriş:</span>
                  <span className="font-medium">
                    {auth.currentUser?.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Öğrenci No:</span>
                  <span className="font-medium">{userProfile?.studentId || 'Belirtilmemiş'}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transform transition-all duration-200 hover:shadow-lg font-medium"
                  onClick={() => router.push('/profile')}
                >
                  Profili Düzenle
                </button>
              </div>
            </div>
          </div>
        );
      case 'statistics':
      case 'calendar':
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4 text-gray-300 flex justify-center">
              {activeTab === 'statistics' && <BarChart size={64} className="text-blue-500" />}
              {activeTab === 'calendar' && <Calendar size={64} className="text-purple-500" />}
              {activeTab === 'settings' && <Settings size={64} className="text-gray-500" />}
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {activeTab === 'statistics' && 'İstatistikler'}
              {activeTab === 'calendar' && 'Takvim'}
              {activeTab === 'settings' && 'Ayarlar'}
            </h2>
            <p className="text-gray-500">Bu özellik henüz geliştirme aşamasındadır.</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col md:flex-row">
      {/* Mobil menü butonu */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 flex justify-between items-center md:hidden border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Öğrenci Paneli</h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Sol yan çubuğu - mobil için modal, desktop için sabit */}
      <div className={`
        fixed inset-0 z-40 md:relative md:inset-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-64 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 rounded-r-2xl md:rounded-none shadow-xl
      `}>
        <div className="p-5 border-b border-white border-opacity-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userProfile?.photoURL ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || 'Profil'} 
                  className="object-cover"
                  fill
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
                {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-white font-medium truncate max-w-[150px]">
                {userProfile?.displayName || userProfile?.firstName || 'Öğrenci'}
              </div>
              <div className="text-xs text-white text-opacity-70">{userProfile?.role || 'Öğrenci'}</div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-full text-white hover:bg-white hover:bg-opacity-10 md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Menü öğeleri */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${activeTab === item.id 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                  }
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Çıkış butonu */}
        <div className="p-4 border-t border-white border-opacity-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-white bg-opacity-10 text-white hover:bg-opacity-20 transition-all duration-200"
          >
            <LogOut size={18} className="mr-2" />
            Çıkış Yap
          </button>
        </div>
      </div>
      
      {/* Yarı saydam overlay (sadece mobil için) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Ana içerik alanı */}
      <div className="flex-1 p-4 md:p-6 md:pt-6 overflow-auto">
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {menuItems.find(item => item.id === activeTab)?.label || 'Öğrenci Paneli'}
          </h1>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
} 