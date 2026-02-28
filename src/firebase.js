// src/firebase.js
// ─────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Create a project → Add a Web App
// STEP 3: Paste your config values below
// STEP 4: Enable Firestore Database in Firebase console
// ─────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app"
import { getFirestore }  from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBrpjSPNWErSFsgU-ZZ_mryy5BA3FPnJ7g",
  authDomain: "axelon-comingsoon.firebaseapp.com",
  projectId: "axelon-comingsoon",
  storageBucket: "axelon-comingsoon.firebasestorage.app",
  messagingSenderId: "574345114301",
  appId: "1:574345114301:web:46ca0860cf681509983dd4",
  measurementId: "G-EMEP5XLQGX"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
