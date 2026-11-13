import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDocumentBlob } from '../firebase/fileStore';

/**
 * Standard official document naming map for downloads and ZIP archives.
 */
export const OFFICIAL_DOCUMENT_NAMES = {
  ssc_marksheet: 'SSC MM',
  ssc_certificate: 'SSC PC',
  hsc_marksheet: 'HSC MM',
  hsc_certificate: 'HSC PC',
  ncl_cert: 'NCL',
  caste_cert: 'CASTE CERTIFICATE',
  caste_validity: 'CASTE VALIDITY',
  cet_scorecard: 'CET SCORECARD',
  domicile_cert: 'DOMICILE CERTIFICATE',
  leaving_cert: 'LC TC',
  birth_cert: 'BIRTH CERTIFICATE',
  aadhar_card: 'AADHAAR CARD',
  income_cert: 'INCOME CERTIFICATE',
  ews_cert: 'EWS CERTIFICATE',
  gap_cert: 'GAP AFFIDAVIT',
  photo: 'PASSPORT PHOTO',
  signature: 'SIGNATURE',
  defence_cert: 'DEFENCE CERTIFICATE',
  relation_cert: 'DEFENCE PROFORMA',
  orphan_cert: 'ORPHAN CERTIFICATE',
  pwd_cert: 'PWD CERTIFICATE',
  fee_income_cert: 'FEE CONCESSION INCOME',
  fee_bank_passbook: 'BANK PASSBOOK',
  fee_ration_card: 'RATION CARD',
  fee_caste_cert: 'FEE CONCESSION CASTE',
};

/**
 * Returns clean standardized filename for any document key, keeping extension.
 */
export function getStandardDocFileName(docKey = '', originalFileName = '') {
  if (!docKey) return 'DOCUMENT.pdf';

  const extMatch = (originalFileName || '').match(/\.(pdf|jpg|jpeg|png)$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';

  const cleanKey = (docKey || '').toString().toLowerCase().trim();
  if (!cleanKey) return `DOCUMENT${ext}`;

  let baseName = OFFICIAL_DOCUMENT_NAMES[cleanKey];

  if (!baseName) {
    if (cleanKey.includes('ssc') || cleanKey.includes('10th')) baseName = 'SSC MM';
    else if (cleanKey.includes('hsc') || cleanKey.includes('12th')) baseName = 'HSC MM';
    else if (cleanKey.includes('ncl') || cleanKey.includes('creamy')) baseName = 'NCL';
    else if (cleanKey.includes('validity')) baseName = 'CASTE VALIDITY';
    else if (cleanKey.includes('caste')) baseName = 'CASTE CERTIFICATE';
    else if (cleanKey.includes('cet') || cleanKey.includes('jee')) baseName = 'CET SCORECARD';
    else if (cleanKey.includes('domicile') || cleanKey.includes('nationality')) baseName = 'DOMICILE CERTIFICATE';
    else if (cleanKey.includes('leaving') || cleanKey.includes('lc') || cleanKey.includes('tc')) baseName = 'LC TC';
    else if (cleanKey.includes('aadhar') || cleanKey.includes('aadhaar')) baseName = 'AADHAAR CARD';
    else if (cleanKey.includes('income')) baseName = 'INCOME CERTIFICATE';
    else if (cleanKey.includes('ews')) baseName = 'EWS CERTIFICATE';
    else if (cleanKey.includes('photo')) baseName = 'PASSPORT PHOTO';
    else if (cleanKey.includes('signature') || cleanKey.includes('sign')) baseName = 'SIGNATURE';
    else {
      baseName = cleanKey.replace(/_/g, ' ').toUpperCase() || 'DOCUMENT';
    }
  }

  return `${baseName}${ext}`;
}

/**
 * Trigger direct file download with standardized filename for any URL/dataURL.
 */
export function downloadSingleFile(url, docKey, originalFileName = '') {
  if (!url) return;
  const fileName = getStandardDocFileName(docKey, originalFileName);

  // If it's a base64 or blob URL
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Remote URL fetch & download as Blob
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      saveAs(blob, fileName);
    })
    .catch(() => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
}

/**
 * Download a document using the cloud file store (chunked Firestore files)
 * or a legacy URL. Always uses the official admission filename.
 */
export async function downloadDocumentFile(docMeta, docKey, originalFileName = '') {
  const blob = await getDocumentBlob(docMeta);
  const fileName = getStandardDocFileName(docKey, originalFileName || docMeta?.fileName);
  saveAs(blob, fileName);
}

/**
 * Generate the default password for a student.
 * Priority: contact1 → contact2 → DOB as DDMMYYYY → 'ame2027'
 */
export function generateStudentPassword(student) {
  if (student.contact1?.trim()) return student.contact1.trim();
  if (student.contact2?.trim()) return student.contact2.trim();
  if (student.dob) {
    const cleaned = student.dob.replace(/[^0-9]/g, '');
    if (cleaned.length >= 8) return cleaned.slice(0, 8);
  }
  return 'ame2027';
}

export function formatDate(ts) {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(ts) {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Helper to convert Data URL / Base64 to Blob
 */
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Download all documents for a student as a ZIP file with standard filenames.
 */
export async function downloadStudentZip(regNo, studentName, documents) {
  const zip = new JSZip();
  const folderName = `${regNo}_${studentName.replace(/[^a-zA-Z0-9_\- ]/g, '_')}`;
  const folder = zip.folder(folderName);

  const fetchPromises = Object.entries(documents).map(async ([key, docInfo]) => {
    if (!docInfo || docInfo.status === 'NOT_UPLOADED') return;
    const stdFileName = getStandardDocFileName(key, docInfo.fileName);

    try {
      const blob = await getDocumentBlob(docInfo);
      folder.file(stdFileName, blob);
    } catch (e) {
      console.warn(`Skipping document ${key}:`, e.message);
    }
  });

  await Promise.all(fetchPromises);
  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(content, `${folderName}_Documents.zip`);
}

export function getApplicationStatus(documents, requiredDocs) {
  const uploadedCount = Object.values(documents || {})
    .filter(d => d?.status && d.status !== 'NOT_UPLOADED').length;

  const approvedCount = Object.values(documents || {})
    .filter(d => d?.status === 'APPROVED').length;

  const mandatoryDocs = requiredDocs.filter(d => d.mandatory);

  const mandatoryUploaded = mandatoryDocs.filter(d => {
    const status = documents?.[d.key]?.status;
    return status && status !== 'NOT_UPLOADED' && status !== 'REJECTED';
  }).length;

  if (uploadedCount === 0) return 'NOT_STARTED';
  if (mandatoryUploaded < mandatoryDocs.length) return 'IN_PROGRESS';
  if (approvedCount >= mandatoryDocs.length) return 'COMPLETED';
  return 'SUBMITTED';
}
