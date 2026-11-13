import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateStudentPassword(student) {
  if (student.contact1?.trim()) return student.contact1.trim();
  if (student.contact2?.trim()) return student.contact2.trim();
  if (student.dob) {
    const cleaned = student.dob.replace(/[^0-9]/g, '');
    if (cleaned.length >= 8) return cleaned.slice(0, 8);
  }
  return 'ame2027';
}

function saveLocalStudents(students) {
  try {
    const existing = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
    const map = new Map(existing.map(s => [s.regNo.toString(), s]));
    students.forEach(s => map.set(s.regNo.toString(), s));
    localStorage.setItem('ame_local_students', JSON.stringify(Array.from(map.values())));
  } catch (e) {
    console.warn('Local storage write note:', e.message);
  }
}

function getLocalStudents() {
  try {
    return JSON.parse(localStorage.getItem('ame_local_students') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Batch import students into Firestore with local storage backup.
 */
export async function importStudents(studentsArray) {
  const BATCH_SIZE = 400;
  let success = 0;
  const failed = [];
  const processedForLocal = [];

  for (let i = 0; i < studentsArray.length; i += BATCH_SIZE) {
    const chunk = studentsArray.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const student of chunk) {
      try {
        const password = generateStudentPassword(student);
        const passwordHash = await sha256(password);
        const stObj = {
          regNo: student.regNo.toString(),
          name: student.name || '',
          contact1: student.contact1 || '',
          contact2: student.contact2 || '',
          dob: student.dob || '',
          category: student.category || '',
          initialPassword: password,
          passwordHash,
          isDisabled: false,
          applicationStatus: 'NOT_STARTED',
          applyFeeConcession: false,
        };

        processedForLocal.push(stObj);

        const ref = doc(db, 'students', student.regNo.toString());
        batch.set(ref, {
          ...stObj,
          createdAt: serverTimestamp(),
          lastLogin: null,
        });
        success++;
      } catch (err) {
        failed.push({ regNo: student.regNo, error: err.message });
      }
    }

    try {
      await batch.commit();
    } catch (commitErr) {
      console.warn('Firestore batch write note:', commitErr.message);
    }
  }

  saveLocalStudents(processedForLocal);
  return { success: processedForLocal.length, failed };
}

/**
 * Get all students.
 */
export async function getAllStudents() {
  try {
    const snap = await getDocs(collection(db, 'students'));
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (remote.length > 0) {
      remote.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      saveLocalStudents(remote);
      return remote;
    }
  } catch (err) {
    console.warn('Firestore fetch note, reading local cache:', err.message);
  }
  const local = getLocalStudents();
  local.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return local;
}

/**
 * Get a single student by registration number.
 */
export async function getStudent(regNo) {
  const regStr = regNo.toString();
  try {
    const ref = doc(db, 'students', regStr);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn('Firestore get student note:', e.message);
  }
  const local = getLocalStudents();
  return local.find(s => s.regNo.toString() === regStr) || null;
}

/**
 * Update student data.
 */
export async function updateStudent(regNo, data) {
  const regStr = regNo.toString();
  try {
    const ref = doc(db, 'students', regStr);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('Firestore update note:', e.message);
  }
  const local = getLocalStudents();
  const updated = local.map(s => s.regNo.toString() === regStr ? { ...s, ...data } : s);
  localStorage.setItem('ame_local_students', JSON.stringify(updated));
}

/**
 * Delete a student.
 */
export async function deleteStudent(regNo) {
  const regStr = regNo.toString();
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'students', regStr));
    batch.delete(doc(db, 'student_documents', regStr));
    await batch.commit();
  } catch (e) {
    console.warn('Firestore delete note:', e.message);
  }
  const local = getLocalStudents();
  const filtered = local.filter(s => s.regNo.toString() !== regStr);
  localStorage.setItem('ame_local_students', JSON.stringify(filtered));
}

/**
 * Enable or disable a student account.
 */
export async function enableDisableStudent(regNo, disabled) {
  await updateStudent(regNo, { isDisabled: disabled });
}

/**
 * Search students.
 */
export async function searchStudents(queryStr) {
  const all = await getAllStudents();
  if (!queryStr?.trim()) return all;
  const q = queryStr.toLowerCase().trim();
  return all.filter(s =>
    s.regNo?.toString().toLowerCase().includes(q) ||
    s.name?.toLowerCase().includes(q) ||
    s.category?.toLowerCase().includes(q) ||
    s.contact1?.includes(q) ||
    s.contact2?.includes(q)
  );
}

export async function updateApplicationStatus(regNo, status) {
  await updateStudent(regNo, { applicationStatus: status });
}

export async function updateFeeConcession(regNo, applying) {
  await updateStudent(regNo, { applyFeeConcession: applying });
}
