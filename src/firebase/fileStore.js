import { db } from './config';
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

/**
 * Free-plan file storage.
 *
 * Firebase Storage requires the Blaze (paid) plan for projects created after
 * 30 Oct 2024. To keep the portal fully usable on the free Spark plan, files
 * are split into < 1 MiB binary chunks stored in Firestore sub-documents.
 *
 * Every phone / PC reads the same chunks from Cloud Firestore, so uploaded
 * documents appear on all devices just like a normal cloud bucket.
 */

const CHUNK_SIZE = 700 * 1024; // 700 KB of raw bytes per Firestore document
const MAX_FILE_SIZE = 4.5 * 1024 * 1024;
const blobCache = new Map();
const urlCache = new Map();

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function cleanSegment(value) {
  return String(value || 'file').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

function chunkDocId(index) {
  return String(index).padStart(4, '0');
}

export function dataUrlToBlob(dataUrl) {
  const [header, base64] = String(dataUrl).split(',');
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Downscale large photos in the browser before saving. Scanned admission
 * certificates are still perfectly readable at 2000 px / 82% JPEG quality,
 * while using a fraction of the free Firestore quota.
 */
async function compressImage(file) {
  if (!file.type?.startsWith('image/') || file.size < 250 * 1024) return file;

  try {
    const imageUrl = URL.createObjectURL(file);
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read this image'));
      img.src = imageUrl;
    });

    const maxDimension = 2000;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    );
    URL.revokeObjectURL(imageUrl);

    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.(png|jpe?g|webp|bmp)$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('Image compression skipped:', err.message);
    return file;
  }
}

async function uploadBytesToCloud({ regNo, docKey, bytes, fileName, fileType, onProgress }) {
  const fileId = `${cleanSegment(regNo)}_${cleanSegment(docKey)}_${Date.now()}_${randomId().slice(0, 8)}`;
  const chunkCount = Math.max(1, Math.ceil(bytes.byteLength / CHUNK_SIZE));
  const fileRef = doc(db, 'document_files', fileId);

  await setDoc(fileRef, {
    regNo: String(regNo),
    docKey,
    fileName,
    fileType,
    fileSize: bytes.byteLength,
    chunkCount,
    createdAt: serverTimestamp(),
  });

  try {
    for (let i = 0; i < chunkCount; i += 1) {
      const start = i * CHUNK_SIZE;
      const slice = bytes.slice(start, Math.min(start + CHUNK_SIZE, bytes.byteLength));
      await setDoc(doc(db, 'document_files', fileId, 'chunks', chunkDocId(i)), {
        data: Bytes.fromUint8Array(slice),
        size: slice.byteLength,
      });
      if (onProgress) {
        onProgress(Math.round(((i + 1) / chunkCount) * 100));
      }
    }
  } catch (err) {
    // Best-effort cleanup so a failed upload does not leave orphaned data.
    cleanupFile(fileId, chunkCount).catch(() => {});
    throw new Error(
      `Could not save the file to the cloud. ${err.message || 'Please check your internet connection and try again.'}`
    );
  }

  return {
    fileId,
    chunkCount,
    fileName,
    fileType,
    fileSize: bytes.byteLength,
    storageType: 'firestore',
  };
}

/**
 * Upload a File/Blob to Cloud Firestore using chunked binary documents.
 */
export async function uploadFileToCloud(regNo, docKey, file, onProgress) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 4.5 MB on the free cloud plan.');
  }

  if (onProgress) onProgress(2);
  const prepared = await compressImage(file);
  if (onProgress) onProgress(8);

  const buffer = await prepared.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return uploadBytesToCloud({
    regNo,
    docKey,
    bytes,
    fileName: prepared.name || file.name,
    fileType: prepared.type || file.type || 'application/octet-stream',
    onProgress: (pct) => {
      if (onProgress) onProgress(8 + Math.round(pct * 0.9));
    },
  });
}

/**
 * Upload raw bytes (used by the local-data migration tool).
 */
export async function uploadBlobToCloud(regNo, docKey, blob, fileName, onProgress) {
  const buffer = await blob.arrayBuffer();
  return uploadBytesToCloud({
    regNo,
    docKey,
    bytes: new Uint8Array(buffer),
    fileName,
    fileType: blob.type || 'application/octet-stream',
    onProgress,
  });
}

/**
 * Read a chunked file back as a Blob.
 */
export async function getFileBlob(fileId) {
  if (!fileId) throw new Error('This document has no stored file.');
  if (blobCache.has(fileId)) return blobCache.get(fileId);

  const metaSnap = await getDoc(doc(db, 'document_files', fileId));
  if (!metaSnap.exists()) {
    throw new Error('The stored file was not found in the cloud. Please re-upload it.');
  }
  const meta = metaSnap.data();
  const chunkCount = Number(meta.chunkCount || 0);
  if (!chunkCount) throw new Error('The stored file is incomplete. Please re-upload it.');

  const chunkSnaps = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      getDoc(doc(db, 'document_files', fileId, 'chunks', chunkDocId(index)))
    )
  );

  const parts = chunkSnaps.map((snap, index) => {
    if (!snap.exists()) {
      throw new Error(`File part ${index + 1} of ${chunkCount} is missing. Please re-upload.`);
    }
    return snap.data().data.toUint8Array();
  });

  const blob = new Blob(parts, {
    type: meta.fileType || 'application/octet-stream',
  });
  blobCache.set(fileId, blob);
  return blob;
}

/**
 * Get a browser-usable URL for a stored document (object URL or legacy URL).
 */
export async function getDocumentFileUrl(docMeta) {
  if (!docMeta) return null;

  const legacyUrl = docMeta.url || docMeta.downloadURL;
  if (legacyUrl && !docMeta.fileId) return legacyUrl;

  if (docMeta.fileId) {
    if (urlCache.has(docMeta.fileId)) return urlCache.get(docMeta.fileId);
    const blob = await getFileBlob(docMeta.fileId);
    const url = URL.createObjectURL(blob);
    urlCache.set(docMeta.fileId, url);
    return url;
  }

  return legacyUrl || null;
}

/**
 * Get a document as a Blob, supporting both legacy URLs and chunk storage.
 */
export async function getDocumentBlob(docMeta) {
  if (!docMeta) throw new Error('Document not found.');

  const legacyUrl = docMeta.url || docMeta.downloadURL;
  if (legacyUrl && !docMeta.fileId) {
    if (legacyUrl.startsWith('data:')) return dataUrlToBlob(legacyUrl);
    const response = await fetch(legacyUrl);
    if (!response.ok) throw new Error(`Could not download the file (HTTP ${response.status}).`);
    return response.blob();
  }

  if (docMeta.fileId) return getFileBlob(docMeta.fileId);
  throw new Error('No file is attached to this document.');
}

/**
 * Delete all chunks belonging to a file.
 */
export async function cleanupFile(fileId, chunkCount = null) {
  if (!fileId) return;

  let total = chunkCount;
  if (total == null) {
    const metaSnap = await getDoc(doc(db, 'document_files', fileId));
    if (!metaSnap.exists()) return;
    total = Number(metaSnap.data().chunkCount || 0);
  }

  const chunksSnap = await getDocs(collection(db, 'document_files', fileId, 'chunks'));
  const refs = chunksSnap.docs.map((d) => d.ref);

  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  if (refs.length === 0 && total > 0) {
    // Fallback for unusual/partial data: delete known chunk ids one by one.
    for (let i = 0; i < total; i += 1) {
      await deleteDoc(doc(db, 'document_files', fileId, 'chunks', chunkDocId(i))).catch(() => {});
    }
  }

  await deleteDoc(doc(db, 'document_files', fileId)).catch(() => {});
  blobCache.delete(fileId);
  const oldUrl = urlCache.get(fileId);
  if (oldUrl) URL.revokeObjectURL(oldUrl);
  urlCache.delete(fileId);
}

export const FILE_LIMITS = {
  maxSize: MAX_FILE_SIZE,
  chunkSize: CHUNK_SIZE,
};
