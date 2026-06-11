import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCPSvqAZU8p6JFN8o6wGQLf-Au4v4xZU1M",
  authDomain: "expencetracker-39334.firebaseapp.com",
  projectId: "expencetracker-39334",
  storageBucket: "expencetracker-39334.firebasestorage.app",
  messagingSenderId: "91888179392",
  appId: "1:91888179392:web:b3361eed2c75de9b03f525",
  measurementId: "G-ZLG024WHSY"
};

const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== "undefined" && "serviceWorker" in navigator ? getMessaging(app) : null;

export { getToken, onMessage };
