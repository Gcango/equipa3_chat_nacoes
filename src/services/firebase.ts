import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';

const firebaseConfig = {
  apiKey: "AIzaSyDogSbSyaIKu4o8TUzj-hxN_-CbqYehakk",
  authDomain: "chat-nacoes.firebaseapp.com",
  projectId: "chat-nacoes",
  storageBucket: "chat-nacoes.firebasestorage.app",
  messagingSenderId: "71502428785",
  appId: "1:71502428785:web:76e77b37e71382a24bf9d0",
  measurementId: "G-BH1CCRW195"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// @ts-ignore
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;