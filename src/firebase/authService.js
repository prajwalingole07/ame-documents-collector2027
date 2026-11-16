import { db } from './config';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { sha256 } from './crypto';

const ADMIN_CONFIG_REF = () => doc(db, 'admin_config', 'credentials');
const DEFAULT_ADMIN_ID = 'ame2027';
const DEFAULT_ADMIN_PASSWORD = 'ame@2027';

function cloudError(err) {
  const message = err?.message || 'Unknown error';
  if (/permission|insufficient/i.test(message)) {
    return new Error(
      'Cloud database permission denied. Please ask the administrator to deploy the latest firestore.rules file.'
    );
  }
  if (/offline|network|unavailable|failed to get/i.test(message)) {
    return new Error(
      'Could not reach the cloud database. Please check your internet connection and try again.'
    );
  }
  return new Error(`Cloud database error: ${message}`);
}

export async function adminLogin(adminId, password) {
  if (!adminId?.trim()) throw new Error('Please enter your Admin ID.');
  if (!password) throw new Error('Please enter your password.');

  let config = null;
  try {
    const snap = await getDoc(ADMIN_CONFIG_REF());
    if (snap.exists()) config = snap.data();
  } catch (err) {
    throw cloudError(err);
  }

  if (!config) {
    // First run: create the credentials document from the default password.
    const passwordHash = await sha256(DEFAULT_ADMIN_PASSWORD);
    try {
      await setDoc(
        ADMIN_CONFIG_REF(),
        {
          adminId: DEFAULT_ADMIN_ID,
          passwordHash,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      throw cloudError(err);
    }
    config = { adminId: DEFAULT_ADMIN_ID, passwordHash };
  }

  const expectedAdminId = config.adminId || DEFAULT_ADMIN_ID;
  if (adminId.trim() !== expectedAdminId) {
    throw new Error('Invalid Admin ID.');
  }

  const inputHash = await sha256(password);
  if (inputHash !== config.passwordHash) {
    throw new Error('Invalid Admin Password. Please try again.');
  }

  const session = {
    role: 'admin',
    adminId: expectedAdminId,
    name: 'Administrator',
    sessionId: Date.now(),
  };
  localStorage.setItem('ame_session', JSON.stringify(session));
  return session;
}

export async function studentLogin(regNo, password) {
  const regStr = String(regNo || '').trim();
  if (!regStr) throw new Error('Please enter your Registration / Receipt Number.');

  let studentData = null;
  try {
    const snap = await getDoc(doc(db, 'students', regStr));
    if (snap.exists()) studentData = snap.data();
  } catch (err) {
    throw cloudError(err);
  }

  if (!studentData) {
    throw new Error(
      'Student not found. Your account may not have been imported by the admin office yet. Please check your Registration / Receipt Number.'
    );
  }

  if (studentData.isDisabled) {
    throw new Error('Your account has been disabled. Please contact the Admin Office (94226 11661).');
  }

  const inputHash = await sha256(password);
  const matchHash = studentData.passwordHash === inputHash;
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
    throw new Error(
      'Incorrect password. Please enter your registered mobile number or Date of Birth (DDMMYYYY).'
    );
  }

  // Record the login in the cloud so the admin sees real activity.
  try {
    await setDoc(
      doc(db, 'students', regStr),
      { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    // Login should still succeed if the activity stamp fails.
  }

  const session = {
    role: 'student',
    regNo: regStr,
    name: studentData.name,
    category: studentData.category,
    sessionId: Date.now(),
  };
  localStorage.setItem('ame_session', JSON.stringify(session));
  return session;
}

export async function logout() {
  localStorage.removeItem('ame_session');
}

export function getCurrentSession() {
  try {
    const s = localStorage.getItem('ame_session');
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}


export async function changeAdminPassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password should be at least 6 characters long.');
  }

  let config = null;
  try {
    const snap = await getDoc(ADMIN_CONFIG_REF());
    if (snap.exists()) config = snap.data();
  } catch (err) {
    throw cloudError(err);
  }

  const currentHash = await sha256(currentPassword || '');
  const validCurrent = config
    ? currentHash === config.passwordHash
    : currentPassword === DEFAULT_ADMIN_PASSWORD;

  if (!validCurrent) {
    throw new Error('Current admin password is incorrect.');
  }

  const newHash = await sha256(newPassword);
  try {
    await setDoc(
      ADMIN_CONFIG_REF(),
      {
        adminId: config?.adminId || DEFAULT_ADMIN_ID,
        passwordHash: newHash,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    throw cloudError(err);
  }
}

export async function resetStudentPassword(regNo, newPassword) {
  const regStr = String(regNo);
  const hash = await sha256(newPassword);
  await setDoc(
    doc(db, 'students', regStr),
    {
      passwordHash: hash,
      initialPassword: newPassword,
      passwordResetAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
