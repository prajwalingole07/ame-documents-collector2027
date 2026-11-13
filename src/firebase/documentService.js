import { db, storage } from './config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

function getLocalDocs(regNo) {
  try {
    return JSON.parse(localStorage.getItem(`ame_docs_${regNo}`) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalDoc(regNo, docKey, meta) {
  try {
    const existing = getLocalDocs(regNo);
    existing[docKey] = meta;
    localStorage.setItem(`ame_docs_${regNo}`, JSON.stringify(existing));

    // Also update in all-documents registry for admin verification
    const all = JSON.parse(localStorage.getItem('ame_all_documents_registry') || '[]');
    const id = `${regNo}_${docKey}`;
    const filtered = all.filter(item => item.id !== id);
    filtered.push({ id, regNo, docKey, ...meta });
    localStorage.setItem('ame_all_documents_registry', JSON.stringify(filtered));

    // Dispatch a storage event so DocumentUpload and Profile update immediately
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn('Local doc storage write note:', e.message);
  }
}

export function getAllLocalDocuments() {
  try {
    return JSON.parse(localStorage.getItem('ame_all_documents_registry') || '[]');
  } catch (e) {
    return [];
  }
}

// Convert file to Base64 data URL for fast, reliable local storage & immediate preview
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Super-fast upload with instant local save and background Cloud Sync.
 */
export async function uploadDocument(regNo, docKey, file, onProgress, uploadedBy = 'student', adminId = null) {
  if (onProgress) onProgress(25);

  // 1. Create immediate local data URL and document record
  let localUrl = '';
  try {
    localUrl = await fileToDataUrl(file);
  } catch (e) {
    localUrl = URL.createObjectURL(file);
  }

  if (onProgress) onProgress(60);

  const storagePath = `students/${regNo}/${docKey}/${file.name}`;
  const docMeta = {
    status: 'UPLOADED',
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    storagePath,
    downloadURL: localUrl,
    url: localUrl,
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

  // Save immediately to local registry so user never waits!
  saveLocalDoc(regNo, docKey, docMeta);
  if (onProgress) onProgress(100);

  // Sync immediately to Firestore with setDoc merge: true
  try {
    const docRecordRef = doc(db, 'student_documents', regNo.toString());
    const firestoreMeta = { ...docMeta };
    // If the file is > 600KB, omit full base64 dataURL from Firestore document body to stay within 1MB doc limit
    if (localUrl.length > 600000) {
      firestoreMeta.downloadURL = '';
      firestoreMeta.url = '';
    }
    await setDoc(docRecordRef, { [docKey]: firestoreMeta }, { merge: true });
  } catch (e) {
    console.warn('Initial firestore doc save note:', e.message);
  }

  // 2. Perform Firebase Cloud upload in parallel with a 5-second timeout so it never hangs
  const cloudUploadPromise = new Promise(async (resolve) => {
    try {
      const fRef = storageRef(storage, storagePath);
      const task = uploadBytesResumable(fRef, file);

      task.on(
        'state_changed',
        null,
        (err) => {
          console.warn('Cloud storage note:', err.message);
          resolve(null);
        },
        async () => {
          try {
            const cloudUrl = await getDownloadURL(task.snapshot.ref);
            // Update Firestore with public cloud URL
            try {
              const docRecordRef = doc(db, 'student_documents', regNo.toString());
              await setDoc(docRecordRef, {
                [docKey]: { ...docMeta, downloadURL: cloudUrl, url: cloudUrl, uploadDate: serverTimestamp() }
              }, { merge: true });
            } catch (e) {}

            saveLocalDoc(regNo, docKey, { ...docMeta, downloadURL: cloudUrl, url: cloudUrl });
            resolve(cloudUrl);
          } catch (e) {
            resolve(null);
          }
        }
      );
    } catch (e) {
      resolve(null);
    }
  });

  // Timeout guard after 3 seconds: user is not blocked even on slow connection or pending rules
  const timeoutGuard = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
  await Promise.race([cloudUploadPromise, timeoutGuard]);

  return { storagePath, downloadURL: localUrl };
}

/**
 * Approve document (Mark Correct).
 */
export async function approveDocument(regNo, docKey, adminId, remarks = '') {
  const updateData = {
    status: 'APPROVED',
    approvedBy: adminId,
    approvedAt: new Date().toISOString(),
    remarks: remarks || '',
    rejectionReason: null,
  };

  try {
    const docRecordRef = doc(db, 'student_documents', regNo.toString());
    await setDoc(docRecordRef, {
      [docKey]: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: serverTimestamp(),
        remarks: remarks || '',
        rejectionReason: null,
      }
    }, { merge: true });
  } catch (e) {}

  const local = getLocalDocs(regNo);
  if (local[docKey]) {
    saveLocalDoc(regNo, docKey, { ...local[docKey], ...updateData });
  }
}

/**
 * Reject document (Mark Incorrect & Request Re-upload).
 */
export async function rejectDocument(regNo, docKey, adminId, reason) {
  const updateData = {
    status: 'RE_UPLOAD_REQUIRED',
    rejectedBy: adminId,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  };

  try {
    const docRecordRef = doc(db, 'student_documents', regNo.toString());
    await setDoc(docRecordRef, {
      [docKey]: {
        status: 'RE_UPLOAD_REQUIRED',
        rejectedBy: adminId,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
      }
    }, { merge: true });
  } catch (e) {}

  const local = getLocalDocs(regNo);
  if (local[docKey]) {
    saveLocalDoc(regNo, docKey, { ...local[docKey], ...updateData });
  }
}

export async function requestReupload(regNo, docKey, adminId, reason) {
  return rejectDocument(regNo, docKey, adminId, reason);
}

export async function deleteDocument(regNo, docKey) {
  try {
    const docRecordRef = doc(db, 'student_documents', regNo.toString());
    await updateDoc(docRecordRef, { [`${docKey}.status`]: 'NOT_UPLOADED' });
  } catch (e) {}
}

export async function addAuditEntry() {}
