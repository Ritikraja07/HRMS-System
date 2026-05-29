import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let messaging;

const initFirebase = () => {
  if (typeof window === 'undefined') return null;
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.warn('Firebase init failed:', err.message);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const msg = initFirebase();
    if (!msg) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (err) {
    console.warn('FCM token request failed:', err.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  if (typeof window === 'undefined') return () => {};
  try {
    const msg = initFirebase();
    if (!msg) return () => {};
    return onMessage(msg, callback);
  } catch (err) {
    console.warn('FCM foreground message failed:', err.message);
    return () => {};
  }
};

export default initFirebase;
