import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDi-ocPnlw8pc_gmkJORFPF2lUkj8Raz6w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "yeniapp2-105be.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "yeniapp2-105be",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "yeniapp2-105be.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "198254015679",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:198254015679:web:1f645148e77bd8ec69820a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5RY6PJVJPH"
};

// Singleton pattern kullanarak Firebase uygulamasını başlatma (OOP)
class FirebaseApp {
  private static instance: FirebaseApp;
  private app: any;
  private auth: any;
  private db: any;

  private constructor() {
    // Firebase uygulamasını başlat
    if (!getApps().length) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }
    
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  public static getInstance(): FirebaseApp {
    if (!FirebaseApp.instance) {
      FirebaseApp.instance = new FirebaseApp();
    }
    return FirebaseApp.instance;
  }

  public getApp() {
    return this.app;
  }

  public getAuth() {
    return this.auth;
  }

  public getFirestore() {
    return this.db;
  }
}

// Singleton instance'ını dışa aktar
export const firebaseApp = FirebaseApp.getInstance();
export const auth = firebaseApp.getAuth();
export const db = firebaseApp.getFirestore(); 