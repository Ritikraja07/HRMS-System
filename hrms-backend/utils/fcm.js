let admin;
let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;
  try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.warn('⚠️ Firebase Admin not initialized:', err.message);
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return null;

  initFirebase();
  if (!firebaseInitialized || !admin) {
    console.warn('Firebase not initialized, skipping push notification');
    return null;
  }

  try {
    const message = {
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      token: fcmToken,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        fcmOptions: {
          link: '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (err) {
    console.error('FCM send error:', err.message);
    return null;
  }
};

const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens || fcmTokens.length === 0) return null;

  initFirebase();
  if (!firebaseInitialized || !admin) {
    console.warn('Firebase not initialized, skipping push notifications');
    return null;
  }

  try {
    const message = {
      notification: { title, body },
      data,
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (err) {
    console.error('FCM multicast error:', err.message);
    return null;
  }
};

module.exports = { sendPushNotification, sendMulticastNotification };
