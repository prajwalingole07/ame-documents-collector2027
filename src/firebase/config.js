import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDyRdsquFTS0BEfjJNBjSkLAoddcDb_VBc",
  authDomain: "ame-student-portal-2027.firebaseapp.com",
  projectId: "ame-student-portal-2027",
  storageBucket: "ame-student-portal-2027.firebasestorage.app",
  messagingSenderId: "42895967926",
  appId: "1:42895967926:web:e799bd279be8a0c5fe4817"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
