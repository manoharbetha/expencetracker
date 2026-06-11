importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCPSvqAZU8p6JFN8o6wGQLf-Au4v4xZU1M",
  authDomain: "expencetracker-39334.firebaseapp.com",
  projectId: "expencetracker-39334",
  storageBucket: "expencetracker-39334.firebasestorage.app",
  messagingSenderId: "91888179392",
  appId: "1:91888179392:web:b3361eed2c75de9b03f525",
  measurementId: "G-ZLG024WHSY"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
