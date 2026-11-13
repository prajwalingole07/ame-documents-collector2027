import { db } from './config';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { dataUrlToBlob, FILE_LIMITS, uploadBlobToCloud } from './fileStore';
import { sha256 } from './crypto';
import { generateStudentPassword } from './studentService';

/**
 * One-time migration for data created by the old per-device version of the
 * portal. That version saved students and files (as Base64 data URLs) only in
 * this browser's localStorage because Firestore writes were blocked.
 *
 * This helper scans the current device and moves everything into the cloud so
 * the data becomes visible on every phone / PC.
 */

const LOCAL_STUDENTS_KEY = 'ame_local_students';
const LOCAL_REGISTRY_KEY = 'ame_all_documents_registry';
const MIGRATION_MARKER = 'ame_cloud_migration_v2';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function normalizeRegNo(value) {
  return String(value || '').trim();
}

function hasLocalFile(meta) {
  // Only docs with real local file data (Base64 or an old remote URL) need
  // migration. A `fileId` means the file is already in the new cloud store.
  return Boolean(
    meta &&
      !meta.fileId &&
      ((typeof meta.url === 'string' && meta.url.length > 0) ||
        (typeof meta.downloadURL === 'string' && meta.downloadURL.length > 0))
  );
}

/**
 * Read all old local data from this browser.
 */
export function scanLocalData() {
  const students = readJSON(LOCAL_STUDENTS_KEY, []);
  const registry = readJSON(LOCAL_REGISTRY_KEY, []);

  const docsByReg = {};

  const addDoc = (regNo, docKey, meta) => {
    const reg = normalizeRegNo(regNo);
    if (!reg || !docKey || !meta) return;
    if (!docsByReg[reg]) docsByReg[reg] = {};
    // Prefer the registry entry over the per-student entry, but merge both.
    docsByReg[reg][docKey] = { ...(docsByReg[reg][docKey] || {}), ...meta };
  };

  registry.forEach((item) => {
    if (item?.regNo && item?.docKey) {
      const { id, docKey, regNo, ...meta } = item;
      addDoc(regNo, docKey, meta);
    }
  });

  // The per-student record is the most complete copy (contains the Base64 file).
  students.forEach((st) => {
    const reg = normalizeRegNo(st.regNo);
    if (!reg) return;
    const localDocs = readJSON(`ame_docs_${reg}`, {});
    Object.entries(localDocs).forEach(([docKey, meta]) => addDoc(reg, docKey, meta));
  });

  const uploadedDocs = [];
  Object.entries(docsByReg).forEach(([regNo, docs]) => {
    Object.entries(docs).forEach(([docKey, meta]) => {
      if (meta?.status && meta.status !== 'NOT_UPLOADED' && hasLocalFile(meta)) {
        uploadedDocs.push({ regNo, docKey, meta });
      }
    });
  });

  return {
    students,
    docsByReg,
    uploadedDocs,
    marker: localStorage.getItem(MIGRATION_MARKER),
  };
}

async function localMetaToBlob(meta) {
  const rawUrl = meta.url || meta.downloadURL || '';
  if (!rawUrl) throw new Error('No local file data found.');

  if (rawUrl.startsWith('data:')) {
    return dataUrlToBlob(rawUrl);
  }

  if (rawUrl.startsWith('http')) {
    const response = await fetch(rawUrl);
    if (!response.ok) throw new Error(`Could not download old cloud file (HTTP ${response.status}).`);
    return response.blob();
  }

  if (rawUrl.startsWith('blob:')) {
    const response = await fetch(rawUrl);
    return response.blob();
  }

  throw new Error('Unsupported old file format.');
}

/**
 * Migrate this device's local students and documents to Cloud Firestore.
 * Safe to run more than once: already-migrated records are skipped.
 */
export async function migrateLocalDataToCloud({ onProgress } = {}) {
  const { students, docsByReg, uploadedDocs } = scanLocalData();

  const result = {
    studentsAdded: 0,
    studentsSkipped: 0,
    docsMigrated: 0,
    docsSkipped: 0,
    studentsFailed: 0,
    docsFailed: 0,
    errors: [],
  };

  const totalSteps = students.length + uploadedDocs.length;
  let doneSteps = 0;
  const tick = (message) => {
    doneSteps += 1;
    if (onProgress) {
      onProgress({
        percent: totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 100,
        message,
      });
    }
  };

  // 1. Students
  for (const localStudent of students) {
    const regNo = normalizeRegNo(localStudent.regNo);
    if (!regNo) continue;

    try {
      const ref = doc(db, 'students', regNo);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        result.studentsSkipped += 1;
        tick(`Student ${regNo} already in cloud`);
        continue;
      }

      const initialPassword =
        localStudent.initialPassword || generateStudentPassword(localStudent);
      const passwordHash = localStudent.passwordHash || (await sha256(initialPassword));

      await setDoc(
        ref,
        {
          regNo,
          name: localStudent.name || '',
          contact1: localStudent.contact1 || '',
          contact2: localStudent.contact2 || '',
          dob: localStudent.dob || '',
          category: (localStudent.category || 'OPEN').toString().toUpperCase().trim(),
          initialPassword,
          passwordHash,
          isDisabled: Boolean(localStudent.isDisabled),
          applicationStatus: localStudent.applicationStatus || 'NOT_STARTED',
          applyFeeConcession: Boolean(localStudent.applyFeeConcession),
          migratedFromDevice: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      result.studentsAdded += 1;
      tick(`Student ${regNo} uploaded`);
    } catch (err) {
      result.studentsFailed += 1;
      result.errors.push(`Student ${regNo}: ${err.message}`);
      tick(`Student ${regNo} failed`);
    }
  }

  // 2. Documents (binary chunks + metadata)
  for (const { regNo, docKey, meta } of uploadedDocs) {
    try {
      const docsSnap = await getDoc(doc(db, 'student_documents', regNo));
      const cloudDocs = docsSnap.exists() ? docsSnap.data() : {};
      const cloudMeta = cloudDocs[docKey];

      if (cloudMeta?.fileId) {
        result.docsSkipped += 1;
        tick(`${docKey} for ${regNo} already migrated`);
        continue;
      }

      const blob = await localMetaToBlob(meta);
      if (blob.size > FILE_LIMITS.maxSize) {
        throw new Error(
          `original file is ${(blob.size / (1024 * 1024)).toFixed(1)} MB (free cloud limit is 4.5 MB)`
        );
      }

      const fileName = meta.fileName || `${docKey}.pdf`;
      const fileInfo = await uploadBlobToCloud(
        regNo,
        docKey,
        blob,
        fileName,
        (pct) => {
          if (onProgress && totalSteps) {
            const base = Math.round((doneSteps / totalSteps) * 100);
            const step = Math.round((pct / 100) * (100 / totalSteps));
            onProgress({
              percent: Math.min(99, base + step),
              message: `Uploading ${docKey} for ${regNo} (${pct}%)`,
            });
          }
        }
      );

      // Keep any newer admin decision that already exists in the cloud.
      const status = cloudMeta?.status || meta.status || 'UPLOADED';
      const mergedMeta = {
        status,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        storageType: 'firestore',
        fileId: fileInfo.fileId,
        chunkCount: fileInfo.chunkCount,
        url: '',
        downloadURL: '',
        storagePath: '',
        uploadDate: meta.uploadDate || new Date().toISOString(),
        uploadedBy: meta.uploadedBy || 'migrated-device',
        approvedBy: cloudMeta?.approvedBy || meta.approvedBy || null,
        approvedAt: cloudMeta?.approvedAt || meta.approvedAt || null,
        rejectedBy: cloudMeta?.rejectedBy || meta.rejectedBy || null,
        rejectedAt: cloudMeta?.rejectedAt || meta.rejectedAt || null,
        rejectionReason: cloudMeta?.rejectionReason || meta.rejectionReason || null,
        remarks: cloudMeta?.remarks || meta.remarks || null,
        migratedAt: serverTimestamp(),
      };

      await setDoc(
        doc(db, 'student_documents', regNo),
        { [docKey]: mergedMeta },
        { merge: true }
      );
      result.docsMigrated += 1;
      tick(`${docKey} for ${regNo} migrated`);
    } catch (err) {
      result.docsFailed += 1;
      result.errors.push(`${regNo} / ${docKey}: ${err.message}`);
      tick(`${docKey} for ${regNo} failed`);
    }
  }

  try {
    localStorage.setItem(MIGRATION_MARKER, new Date().toISOString());
  } catch (e) {
    // optional
  }

  if (onProgress) {
    onProgress({ percent: 100, message: 'Migration complete' });
  }

  return result;
}

export function clearMigrationMarker() {
  try {
    localStorage.removeItem(MIGRATION_MARKER);
  } catch (e) {
    // ignore
  }
}
