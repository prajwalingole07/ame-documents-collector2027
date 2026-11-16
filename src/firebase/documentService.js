import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  cleanupFile,
  getDocumentBlob,
  getDocumentFileUrl,
  uploadFileToCloud,
} from './fileStore';

const DOCUMENTS_COLLECTION = 'student_documents';

function docsRef(regNo) {
  return doc(db, DOCUMENTS_COLLECTION, String(regNo));
}

/**
 * Upload a document and publish its metadata to Cloud Firestore.
 * The file itself is stored as chunked binary data by fileStore.js.
 */
export async function uploadDocument(
  regNo,
  docKey,
  file,
  onProgress,
  uploadedBy = 'student',
  adminId = null
) {
  if (!regNo) throw new Error('Missing student registration number.');
  if (!docKey) throw new Error('Missing document type.');

  const fileInfo = await uploadFileToCloud(regNo, docKey, file, (pct) => {
    // Reserve the last 5% for the Firestore metadata write.
    if (onProgress) onProgress(Math.min(95, pct));
  });

  const ref = docsRef(regNo);
  let previous = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) previous = snap.data()[docKey] || null;
  } catch (e) {
    // A brand-new document record is perfectly normal.
  }

  const docMeta = {
    status: 'UPLOADED',
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    fileType: fileInfo.fileType,
    storageType: 'firestore',
    fileId: fileInfo.fileId,
    chunkCount: fileInfo.chunkCount,
    downloadURL: '',
    url: '',
    uploadDate: new Date().toISOString(),
    uploadedBy,
    adminId,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    remarks: null,
  };

  await setDoc(ref, { [docKey]: docMeta }, { merge: true });

  // Mark the application as started (but never downgrade a submitted file).
  try {
    const studentRef = doc(db, 'students', String(regNo));
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const status = studentSnap.data().applicationStatus;
      if (!status || status === 'NOT_STARTED') {
        await setDoc(
          studentRef,
          { applicationStatus: 'IN_PROGRESS', updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    }
  } catch (e) {
    console.warn('Could not update application status:', e.message);
  }

  if (previous?.fileId && previous.fileId !== fileInfo.fileId) {
    cleanupFile(previous.fileId, previous.chunkCount).catch(() => {});
  }

  if (onProgress) onProgress(100);
  return docMeta;
}

/**
 * Live subscription for one student's document metadata.
 */
export function subscribeStudentDocuments(regNo, onData, onError) {
  if (!regNo) {
    onData?.({});
    return () => {};
  }
  return onSnapshot(
    docsRef(regNo),
    (snap) => onData?.(snap.exists() ? snap.data() : {}),
    (err) => onError?.(err)
  );
}

export async function getStudentDocuments(regNo) {
  const snap = await getDoc(docsRef(regNo));
  return snap.exists() ? snap.data() : {};
}

/**
 * Live subscription to every student's document metadata. Returns a map:
 * { [regNo]: { [docKey]: meta } }
 */
export function subscribeAllDocumentsMap(onData, onError) {
  return onSnapshot(
    collection(db, DOCUMENTS_COLLECTION),
    (snap) => {
      const map = {};
      snap.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      onData?.(map);
    },
    (err) => onError?.(err)
  );
}

export async function getAllDocumentsMap() {
  const snap = await getDocs(collection(db, DOCUMENTS_COLLECTION));
  const map = {};
  snap.forEach((docSnap) => {
    map[docSnap.id] = docSnap.data();
  });
  return map;
}

/**
 * Flatten the document map into an array used by dashboards and reports.
 */
export function flattenDocuments(map) {
  const items = [];
  Object.entries(map || {}).forEach(([regNo, docs]) => {
    Object.entries(docs || {}).forEach(([docKey, meta]) => {
      if (meta && typeof meta === 'object' && meta.status) {
        items.push({ id: `${regNo}_${docKey}`, regNo, docKey, ...meta });
      }
    });
  });
  return items;
}

export function subscribeAllDocuments(onData, onError) {
  return subscribeAllDocumentsMap((map) => onData?.(flattenDocuments(map)), onError);
}

/**
 * Approve a document without destroying its file metadata.
 * Dot-notation updates only touch the supplied fields.
 */
export async function approveDocument(regNo, docKey, adminId, remarks = '') {
  await updateDoc(docsRef(regNo), {
    [`${docKey}.status`]: 'APPROVED',
    [`${docKey}.approvedBy`]: adminId,
    [`${docKey}.approvedAt`]: serverTimestamp(),
    [`${docKey}.remarks`]: remarks || '',
    [`${docKey}.rejectionReason`]: null,
    [`${docKey}.rejectedBy`]: null,
    [`${docKey}.rejectedAt`]: null,
  });
}

/**
 * Reject a document and request a re-upload, preserving file metadata.
 */
export async function rejectDocument(regNo, docKey, adminId, reason) {
  if (!reason?.trim()) throw new Error('Please specify why the document is incorrect.');
  await updateDoc(docsRef(regNo), {
    [`${docKey}.status`]: 'RE_UPLOAD_REQUIRED',
    [`${docKey}.rejectedBy`]: adminId,
    [`${docKey}.rejectedAt`]: serverTimestamp(),
    [`${docKey}.rejectionReason`]: reason.trim(),
  });
}

export async function requestReupload(regNo, docKey, adminId, reason) {
  return rejectDocument(regNo, docKey, adminId, reason);
}

/**
 * Remove a single document (metadata + binary chunks).
 */
export async function deleteDocument(regNo, docKey) {
  const snap = await getDoc(docsRef(regNo));
  const meta = snap.exists() ? snap.data()[docKey] : null;
  await updateDoc(docsRef(regNo), {
    [`${docKey}.status`]: 'NOT_UPLOADED',
  }).catch(async () => {
    await setDoc(docsRef(regNo), { [docKey]: { status: 'NOT_UPLOADED' } }, { merge: true });
  });
  if (meta?.fileId) {
    cleanupFile(meta.fileId, meta.chunkCount).catch(() => {});
  }
}

/**
 * Delete every document belonging to a student (used when removing a student).
 */
export async function deleteAllDocumentsForStudent(regNo) {
  const snap = await getDoc(docsRef(regNo));
  if (snap.exists()) {
    const cleanup = Object.values(snap.data())
      .filter((meta) => meta?.fileId)
      .map((meta) => cleanupFile(meta.fileId, meta.chunkCount).catch(() => {}));
    await Promise.all(cleanup);
  }
}

export async function deleteStudentDocumentRecord(regNo) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(docsRef(regNo)).catch(() => {});
}

export { getDocumentBlob, getDocumentFileUrl };

export async function addAuditEntry() {}

// Backwards-compatible no-op for older components. Cloud data is now the
// single source of truth, so there is no separate local registry.
export function getAllLocalDocuments() {
  return [];
}
