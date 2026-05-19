import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDFTRECOheHiwuh68MNfodwi6J3el984kw",
  authDomain: "zdstudio-5b6af.firebaseapp.com",
  databaseURL: "https://zdstudio-5b6af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zdstudio-5b6af",
  storageBucket: "zdstudio-5b6af.firebasestorage.app",
  messagingSenderId: "737277655166",
  appId: "1:737277655166:web:ec1db057352496e96f802f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
