// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue as dbOnValue,
  get as dbGet,
  set as dbSet,
} from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAKMRzJCEsggLYQH8JjltkUAnVNbL43pg",
  authDomain: "revenueearn-3a001.firebaseapp.com",
  databaseURL: "https://revenueearn-3a001-default-rtdb.firebaseio.com",
  projectId: "revenueearn-3a001",
  storageBucket: "revenueearn-3a001.firebasestorage.app",
  messagingSenderId: "95210268419",
  appId: "1:95210268419:web:1050be3f3884f52fb82b36",
  measurementId: "G-H35J7NTZ32"
};


// Initialize Firebase (ensure it's only initialized once)
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database & Storage
const database = getDatabase(app);
const storage = getStorage(app);

// Export everything you need
export {
  app,
  database,
  storage,
  dbRef as ref,
  dbOnValue as onValue,
  dbGet as get,
  dbSet as set,
};

export default app;
