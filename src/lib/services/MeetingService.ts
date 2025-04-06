import { db } from '@/lib/firebase/config';
import { collection, doc, addDoc, getDoc, updateDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { GoogleMeetService } from './GoogleMeetService';

// Toplantı durumu türleri
export type MeetingStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

// Toplantı veri modeli
export interface MeetingData {
  id?: string;
  title: string;
  description: string;
  startTime: Date | Timestamp;
  endTime?: Date | Timestamp;
  level: string;
  topic: string;
  participantCount: number;
  keywords: string[];
  questions: string[];
  hostId: string;
  hostName: string;
  hostPhotoURL: string | null;
  status: MeetingStatus;
  participants: string[];
  meetUrl: string;
  createdAt: any;
  updatedAt: any;
}

export class MeetingService {
  private static MEETINGS_COLLECTION = 'meetings';
  
  /**
   * Yeni bir toplantı oluşturur ve Google Meet bağlantısı sağlar
   * 
   * @param meetingData Toplantı bilgileri
   * @returns Oluşturulan toplantı ID'si
   */
  static async createMeeting(meetingData: Omit<MeetingData, 'id' | 'meetUrl' | 'status' | 'createdAt' | 'updatedAt' | 'endTime'>): Promise<string> {
    try {
      // Toplantı bitiş zamanını hesapla (varsayılan: başlangıç + 1 saat)
      const startTime = meetingData.startTime instanceof Date 
        ? meetingData.startTime 
        : meetingData.startTime.toDate();
      
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 saat
      
      // Google Meet bağlantısı oluştur
      let meetUrl = '';
      
      try {
        // Şimdilik Google Meet API burada çağrılacak
        // API hazır olmadığında hata alınırsa boş string ile devam et
        meetUrl = await GoogleMeetService.createMeeting({
          title: meetingData.title,
          description: meetingData.description,
          startTime: startTime,
          endTime: endTime
        });
      } catch (error) {
        console.warn('Google Meet API error (using placeholder link):', error);
        // Hata durumunda geçici bir bağlantı kullan
        meetUrl = `https://meet.google.com/placeholder-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      // Toplantı durumunu belirle
      // Şu anki zamandan 15 dakika içinde başlayacaksa "active", değilse "scheduled"
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + (15 * 60 * 1000));
      const status: MeetingStatus = startTime <= fifteenMinutesFromNow ? 'active' : 'scheduled';
      
      // Firestore'a toplantı bilgilerini ekle
      const completeData = {
        ...meetingData,
        endTime: endTime,
        status: status,
        meetUrl: meetUrl,
        participants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.MEETINGS_COLLECTION), completeData);
      return docRef.id;
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }
  
  /**
   * Toplantıyı ID'ye göre getirir
   * 
   * @param meetingId Toplantı ID'si
   * @returns Toplantı bilgileri
   */
  static async getMeetingById(meetingId: string): Promise<MeetingData | null> {
    try {
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MeetingData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }
  
  /**
   * Kullanıcının tüm toplantılarını duruma göre getirir
   * 
   * @param userId Kullanıcı ID'si
   * @param status İstenilen toplantı durumu (opsiyonel)
   * @returns Toplantı listesi
   */
  static async getUserMeetings(userId: string, status?: MeetingStatus): Promise<MeetingData[]> {
    try {
      let meetingsQuery;
      
      if (status) {
        // Duruma göre filtreleme yap
        meetingsQuery = query(
          collection(db, this.MEETINGS_COLLECTION),
          where('hostId', '==', userId),
          where('status', '==', status),
          orderBy('startTime', 'asc')
        );
      } else {
        // Tüm toplantıları getir
        meetingsQuery = query(
          collection(db, this.MEETINGS_COLLECTION),
          where('hostId', '==', userId),
          orderBy('startTime', 'asc')
        );
      }
      
      const snapshot = await getDocs(meetingsQuery);
      const meetings: MeetingData[] = [];
      
      snapshot.forEach((doc) => {
        meetings.push({ id: doc.id, ...doc.data() } as MeetingData);
      });
      
      return meetings;
    } catch (error) {
      console.error('Error getting user meetings:', error);
      throw error;
    }
  }
  
  /**
   * Toplantı durumunu günceller
   * 
   * @param meetingId Toplantı ID'si
   * @param status Yeni toplantı durumu
   */
  static async updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<void> {
    try {
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }
  
  /**
   * Toplantıya katılımcı ekler
   * 
   * @param meetingId Toplantı ID'si
   * @param userId Katılımcı ID'si
   */
  static async addParticipant(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Katılımcı zaten ekli mi kontrol et
      if (meeting.participants.includes(userId)) {
        return; // Katılımcı zaten var, işlem yapmaya gerek yok
      }
      
      // Toplantı kapasitesi dolu mu kontrol et
      if (meeting.participants.length >= meeting.participantCount) {
        throw new Error('Meeting is at full capacity');
      }
      
      // Katılımcıyı ekle
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: [...meeting.participants, userId],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }
  
  /**
   * Toplantıdan katılımcı çıkarır
   * 
   * @param meetingId Toplantı ID'si
   * @param userId Katılımcı ID'si
   */
  static async removeParticipant(meetingId: string, userId: string): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Katılımcıyı kaldır
      const docRef = doc(db, this.MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: meeting.participants.filter(id => id !== userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }
  
  /**
   * Zamanlanmış toplantıları aktif duruma getirmek için dinleyici başlatır
   * 
   * @param onMeetingActivated Toplantı aktif olduğunda çağrılacak fonksiyon
   * @returns Dinleyiciyi durdurmak için fonksiyon
   */
  static listenToScheduledMeetings(onMeetingActivated: (meeting: MeetingData) => void): () => void {
    // Şu anda "scheduled" durumundaki toplantıları dinle
    const scheduledMeetingsQuery = query(
      collection(db, this.MEETINGS_COLLECTION),
      where('status', '==', 'scheduled')
    );
    
    // Firestore dinleyicisini başlat
    const unsubscribe = onSnapshot(scheduledMeetingsQuery, (snapshot) => {
      const now = new Date();
      
      snapshot.forEach(async (doc) => {
        const meeting = { id: doc.id, ...doc.data() } as MeetingData;
        const startTime = meeting.startTime instanceof Date 
          ? meeting.startTime 
          : (meeting.startTime as Timestamp).toDate();
        
        // Başlangıç zamanı geldi mi kontrol et (15 dakika kaldıysa aktif et)
        if (startTime.getTime() - now.getTime() <= 15 * 60 * 1000) {
          // Toplantıyı aktif duruma getir
          await this.updateMeetingStatus(doc.id, 'active');
          onMeetingActivated(meeting);
        }
      });
    });
    
    return unsubscribe;
  }
} 