import { messaging, getToken, onMessage } from '../firebase';
import api from './api';
import toast from 'react-hot-toast';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && messaging) {
      const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_FIREBASE_VAPID_KEY is missing. Web push subscriptions may fail.');
      }
      
      const currentToken = await getToken(messaging, { 
        vapidKey
      });
      if (currentToken) {
        // Send token to server
        await api.post('/notifications/token', { fcmToken: currentToken });
        return true;
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return false;
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    callback(payload);
    // Also trigger a browser notification manually if we want
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'New Notification', {
        body: payload.notification?.body,
      });
    }
  });
};
