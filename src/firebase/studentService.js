import { db } from './config';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { sha256 } from './crypto';
import { deleteAllDocumentsForStudent, deleteStudentDocumentRecord } from './documentService';

export function generateStudentPassword(student) {
  if (student.contact1?.trim()) return student.contact1.trim();
  if (student.contact2?.trim()) return student.contact2.trim();
  if (student.dob) {
    const cleaned = student.dob.replace(/[^0-9]/g, '');
    if (cleaned.length >= 8) return cleaned.slice(0, 8);
  }
  return 'ame2027';
}

/* ------------------------------------------------------------------ */
/* Legacy device cache (used only for the one-time migration helper)   */
/* ------------------------------------------------------------------ */

export function getLocalCachedStudents() {
  try {
    return JSON.parse(localStorage.getItem('ame_local_students') || '[]');
  } catch (e) {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Student CRUD                                                       */
/* ------------------------------------------------------------------ */

/**
 * Import students in batches. Uses merge writes so an existing account is
 * never silently wiped.
 */
export async function importStudents(studentsArray) {
  const BATCH_SIZE = 400;
  let success = 0;
  const failed = [];

  for (let i = 0; i < studentsArray.length; i += BATCH_SIZE) {
    const chunk = studentsArray.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const student of chunk) {
      try {
        const password = generateStudentPassword(student);
        const passwordHash = await sha256(password);
        const stObj = {
          regNo: String(student.regNo),
          name: student.name || '',
          contact1: student.contact1 || '',
          contact2: student.contact2 || '',
          dob: student.dob || '',
          category: (student.category || 'OPEN').toString().toUpperCase().trim(),
          initialPassword: password,
          passwordHash,
          isDisabled: false,
          applicationStatus: 'NOT_STARTED',
          applyFeeConcession: Boolean(student.applyFeeConcession),
        };

        batch.set(
          doc(db, 'students', String(student.regNo)),
          {
            ...stObj,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: null,
          },
          { merge: true }
        );
        success += 1;
      } catch (err) {
        failed.push({ regNo: student.regNo, error: err.message });
      }
    }

    await batch.commit();
  }

  return { success, failed };
}

/**
 * Add or update a single student (manual entry).
 */
export async function addStudent(student) {
  const regNo = String(student.regNo || '').trim();
  if (!regNo) throw new Error('Registration number is required.');
  if (!student.name?.trim()) throw new Error('Student name is required.');

  const existing = await getStudent(regNo);
  if (existing) throw new Error(`Student with Reg No ${regNo} already exists.`);

  const password = student.initialPassword || generateStudentPassword(student);
  const passwordHash = await sha256(password);
  const data = {
    regNo,
    name: student.name.trim(),
    category: (student.category || 'OPEN').toString().toUpperCase().trim(),
    contact1: (student.contact1 || '').trim(),
    contact2: (student.contact2 || '').trim(),
    dob: (student.dob || '').trim(),
    initialPassword: password,
    passwordHash,
    isDisabled: false,
    applicationStatus: 'NOT_STARTED',
    applyFeeConcession: Boolean(student.applyFeeConcession),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'students', regNo), data, { merge: true });
  return { id: regNo, ...data };
}

export async function getAllStudents() {
  const snap = await getDocs(collection(db, 'students'));
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return students;
}

/**
 * Live subscription to the student roster. This is what makes the admin
 * dashboard update instantly when a student registers or uploads.
 */
export function subscribeStudents(onData, onError) {
  return onSnapshot(
    collection(db, 'students'),
    (snap) => {
      const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onData?.(students);
    },
    (err) => onError?.(err)
  );
}

export async function getStudent(regNo) {
  const regStr = String(regNo);
  const snap = await getDoc(doc(db, 'students', regStr));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateStudent(regNo, data) {
  const regStr = String(regNo);
  const clean = { ...data };
  delete clean.id;
  await setDoc(
    doc(db, 'students', regStr),
    { ...clean, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteStudent(regNo) {
  const regStr = String(regNo);
  await deleteAllDocumentsForStudent(regStr);
  await deleteStudentDocumentRecord(regStr);
  await deleteDoc(doc(db, 'students', regStr));
  try {
    const local = getLocalCachedStudents().filter((s) => String(s.regNo) !== regStr);
    localStorage.setItem('ame_local_students', JSON.stringify(local));
    localStorage.removeItem(`ame_docs_${regStr}`);
  } catch (e) {
    // ignore
  }
}

export async function enableDisableStudent(regNo, disabled) {
  await updateDoc(doc(db, 'students', String(regNo)), {
    isDisabled: Boolean(disabled),
    updatedAt: serverTimestamp(),
  });
}

export async function searchStudents(queryStr) {
  const all = await getAllStudents();
  if (!queryStr?.trim()) return all;
  const q = queryStr.toLowerCase().trim();
  return all.filter(
    (s) =>
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
  await updateStudent(regNo, { applyFeeConcession: Boolean(applying) });
}
