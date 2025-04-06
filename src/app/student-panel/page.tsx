'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';

export default function StudentPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');
  
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
      // Örnek veri - gerçek uygulamada Firestore'dan çekilecek
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md">
          <h2 className="text-lg font-medium mb-2">Hata</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Öğrenci Paneli</h1>
        <p className="mt-2 text-gray-600">Hoş geldin, {userProfile?.displayName || userProfile?.firstName || 'Öğrenci'}</p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sol Panel - Profil Bilgileri */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                  {userProfile?.photoURL ? (
                    <Image 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName || 'Profil Fotoğrafı'} 
                      className="object-cover"
                      fill
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-2xl font-bold">
                      {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold">{userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || 'Öğrenci'}</h2>
                <p className="text-gray-500">{userProfile?.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {userProfile?.role}
                </div>
                
                <div className="mt-6 w-full">
                  <h3 className="text-lg font-medium mb-3">Profil Bilgileri</h3>
                  <div className="space-y-3">
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
                      className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                      onClick={() => router.push('/profile')}
                    >
                      Profili Düzenle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sağ Panel - Kurslar ve Ödevler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aktif Kurslar */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Aktif Kurslarım</h2>
              
              {activeCourses.length > 0 ? (
                <div className="space-y-4">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h3 className="text-lg font-medium text-blue-600">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Eğitmen: {course.instructorName || 'Belirtilmemiş'}
                        </span>
                        <button 
                          className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                          onClick={() => router.push(`/courses/${course.id}`)}
                        >
                          Kursa Git
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Henüz aktif kursunuz bulunmamaktadır.</p>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => router.push('/courses')}
                >
                  Tüm Kursları Görüntüle →
                </button>
              </div>
            </div>
            
            {/* Bekleyen Ödevler */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Bekleyen Ödevlerim</h2>
              
              {pendingAssignments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">{assignment.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                          <span className="text-sm text-gray-500 block mt-2">
                            Kurs: {assignment.courseName || 'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                            new Date(assignment.dueDate.seconds * 1000) < new Date() 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Teslim Tarihi: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button 
                          className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-md hover:bg-green-100"
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                        >
                          Ödevi Görüntüle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Bekleyen ödeviniz bulunmamaktadır.</p>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => router.push('/assignments')}
                >
                  Tüm Ödevleri Görüntüle →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 