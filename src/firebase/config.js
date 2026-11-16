import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyRdsquFTS0BEfjJNBjSkLAoddcDb_VBc",
  authDomain: "ame-student-portal-2027.firebaseapp.com",
  projectId: "ame-student-portal-2027",
  storageBucket: "ame-student-portal-2027.firebasestorage.app",
  messagingSenderId: "42895967926",
  appId: "1:42895967926:web:e799bd279be8a0c5fe4817"
};

const app = initializeApp(firebaseConfig);

// Cloud Firestore is the single source of truth for students, document
// metadata and the document files themselves (stored as binary chunks).
// Firebase Storage and Firebase Auth are intentionally NOT used because they
// require the paid Blaze plan on newer Firebase projects.
export const db = getFirestore(app);
export default app;
