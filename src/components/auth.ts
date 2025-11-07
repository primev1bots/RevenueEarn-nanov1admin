// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
