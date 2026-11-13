import { db, auth } from './config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function trySignInAnonymously() {
  try {
    await signInAnonymously(auth);
  } catch (err) {
    console.warn('Anonymous auth note (skipped or not enabled in Firebase Console):', err.message);
  }
}

export async function adminLogin(adminId, password) {
  if (adminId !== 'ame2027') {
    throw new Error('Invalid Admin ID.');
  }

  // Attempt anonymous sign in if enabled
  await trySignInAnonymously();

  let adminPasswordValid = false;

  try {
    const ref = doc(db, 'admin_config', 'credentials');
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      const hash = await sha256(password);
      if (data.passwordHash && data.passwordHash === hash) {
        adminPasswordValid = true;
      } else if (password === 'ame@2027') {
        adminPasswordValid = true;
      }
    } else {
      // First run: save default credentials
      const hash = await sha256('ame@2027');
      await setDoc(ref, { adminId: 'ame2027', passwordHash: hash, createdAt: serverTimestamp() });
      if (password === 'ame@2027') adminPasswordValid = true;
    }
  } catch (firestoreErr) {
    console.warn('Firestore remote check warning, validating with built-in master admin credentials:', firestoreErr.message);
    // Built-in initial master admin credentials check
    if (adminId === 'ame2027' && password === 'ame@2027') {
      adminPasswordValid = true;
    } else {
      // Check if custom password was saved in local storage fallback
      const localAdminPwd = localStorage.getItem('ame_admin_custom_pwd');
      if (localAdminPwd && localAdminPwd === password) {
        adminPasswordValid = true;
      }
    }
  }

  if (!adminPasswordValid) {
    throw new Error('Invalid Admin Password. Please try again.');
  }

  const session = {
    role: 'admin',
    adminId,
    name: 'Administrator',
    sessionId: Date.now()
  };

  localStorage.setItem('ame_session', JSON.stringify(session));
  return session;
}

export async function studentLogin(regNo, password) {
  await trySignInAnonymously();

  const regStr = regNo.toString().trim();
  let studentData = null;

  try {
    const ref = doc(db, 'students', regStr);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      studentData = snap.data();
    }
  } catch (firestoreErr) {
    console.warn('Firestore read error:', firestoreErr.message);
  }

  // Fallback to local imported students if Firestore is blocked by security rules
  if (!studentData) {
    const localStudents = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
    studentData = localStudents.find(s => s.regNo.toString() === regStr);
  }

  if (!studentData) {
    throw new Error('Student not found. Please check your Registration / Receipt Number.');
  }

  if (studentData.isDisabled) {
    throw new Error('Your account has been disabled. Please contact the Admin Office (94226 11661).');
  }

  const inputHash = await sha256(password);
  const matchHash = studentData.passwordHash && studentData.passwordHash === inputHash;
  const matchPlain = studentData.initialPassword && studentData.initialPassword === password;
  const matchContact1 = studentData.contact1 && studentData.contact1.trim() === password.trim();
  const matchContact2 = studentData.contact2 && studentData.contact2.trim() === password.trim();

  let matchDob = false;
  if (studentData.dob) {
    const cleanDob = studentData.dob.replace(/[^0-9]/g, '');
    if (cleanDob.length >= 8 && cleanDob.slice(0, 8) === password.trim()) {
      matchDob = true;
    }
  }

  if (!matchHash && !matchPlain && !matchContact1 && !matchContact2 && !matchDob) {
    throw new Error('Incorrect password. Please enter your registered mobile number or Date of Birth (DDMMYYYY).');
  }

  const session = {
    role: 'student',
    regNo: regStr,
    name: studentData.name,
    category: studentData.category,
    sessionId: Date.now()
  };

  localStorage.setItem('ame_session', JSON.stringify(session));
  return session;
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('ame_session');
}

export function getCurrentSession() {
  const s = localStorage.getItem('ame_session');
  return s ? JSON.parse(s) : null;
}

export async function changeAdminPassword(currentPassword, newPassword) {
  let updatedInFirestore = false;
  try {
    const ref = doc(db, 'admin_config', 'credentials');
    const newHash = await sha256(newPassword);
    await updateDoc(ref, { passwordHash: newHash, updatedAt: serverTimestamp() });
    updatedInFirestore = true;
  } catch (e) {
    console.warn('Could not update firestore admin password:', e.message);
  }
  // Store local fallback
  localStorage.setItem('ame_admin_custom_pwd', newPassword);
}

export async function resetStudentPassword(regNo, newPassword) {
  const hash = await sha256(newPassword);
  try {
    const ref = doc(db, 'students', regNo.toString());
    await updateDoc(ref, {
      passwordHash: hash,
      initialPassword: newPassword,
      passwordResetAt: serverTimestamp()
    });
  } catch (e) {
    // update local fallback
    const local = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
    const updated = local.map(s => s.regNo.toString() === regNo.toString() ? { ...s, passwordHash: hash, initialPassword: newPassword } : s);
    localStorage.setItem('ame_local_students', JSON.stringify(updated));
  }
}
