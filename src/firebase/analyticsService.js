import { db } from './config';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const DOC_STATUSES = ['UPLOADED', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'RE_UPLOAD_REQUIRED'];

/**
 * Get overall dashboard statistics.
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  const [studentsSnap, docsSnap] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'student_documents')),
  ]);

  const students = studentsSnap.docs.map(d => d.data());
  const totalStudents = students.length;
  const activeStudents = students.filter(s => !s.isDisabled).length;
  const disabledStudents = students.filter(s => s.isDisabled).length;

  // Count by application status
  const statusCounts = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    SUBMITTED: 0,
    COMPLETED: 0,
  };
  students.forEach(s => {
    const st = s.applicationStatus || 'NOT_STARTED';
    if (statusCounts[st] !== undefined) statusCounts[st]++;
    else statusCounts['NOT_STARTED']++;
  });

  // Document-level counts
  let totalDocsUploaded = 0;
  let totalDocsApproved = 0;
  let totalDocsRejected = 0;
  let totalDocsPending = 0;
  let totalDocsReupload = 0;
  let studentsWithAnyDoc = 0;

  docsSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const entries = Object.values(data).filter(v => v && typeof v === 'object' && v.status);
    if (entries.length > 0) studentsWithAnyDoc++;

    entries.forEach(entry => {
      totalDocsUploaded++;
      switch (entry.status) {
        case 'APPROVED':           totalDocsApproved++; break;
        case 'REJECTED':           totalDocsRejected++; break;
        case 'RE_UPLOAD_REQUIRED': totalDocsReupload++; break;
        default:                   totalDocsPending++;
      }
    });
  });

  return {
    totalStudents,
    activeStudents,
    disabledStudents,
    statusCounts,
    totalDocsUploaded,
    totalDocsApproved,
    totalDocsRejected,
    totalDocsPending,
    totalDocsReupload,
    studentsWithAnyDoc,
    studentsWithNoDoc: totalStudents - studentsWithAnyDoc,
  };
}

/**
 * Get category-wise student counts.
 * @returns {Promise<Array>} array of { category, count }
 */
export async function getCategoryWiseStats() {
  const snap = await getDocs(collection(db, 'students'));
  const counts = {};

  snap.docs.forEach(d => {
    const cat = d.data().category?.toUpperCase().trim() || 'UNKNOWN';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get per-student document completion percentage.
 * @returns {Promise<Array>} array of { regNo, name, completionPct, uploaded, approved }
 */
export async function getDocumentCompletionStats() {
  const [studentsSnap, docsSnap] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'student_documents')),
  ]);

  const studentMap = {};
  studentsSnap.docs.forEach(d => {
    studentMap[d.id] = d.data();
  });

  const docMap = {};
  docsSnap.docs.forEach(d => {
    docMap[d.id] = d.data();
  });

  return Object.entries(studentMap).map(([regNo, student]) => {
    const docs = docMap[regNo] || {};
    const entries = Object.values(docs).filter(v => v && typeof v === 'object' && v.status);
    const uploaded = entries.length;
    const approved = entries.filter(e => e.status === 'APPROVED').length;
    const rejected = entries.filter(e => e.status === 'REJECTED').length;
    const pending  = entries.filter(e => e.status === 'UPLOADED' || e.status === 'UNDER_VERIFICATION').length;

    // Completion assumes 15 common docs minimum
    const totalRequired = 15;
    const completionPct = Math.min(100, Math.round((uploaded / totalRequired) * 100));

    return {
      regNo,
      name: student.name,
      category: student.category,
      applicationStatus: student.applicationStatus || 'NOT_STARTED',
      uploaded,
      approved,
      rejected,
      pending,
      completionPct,
    };
  }).sort((a, b) => b.completionPct - a.completionPct);
}

/**
 * Get document status distribution (for charts).
 * @returns {Promise<Array>} array of { status, count }
 */
export async function getDocumentStatusDistribution() {
  const snap = await getDocs(collection(db, 'student_documents'));
  const counts = {
    UPLOADED: 0,
    UNDER_VERIFICATION: 0,
    APPROVED: 0,
    REJECTED: 0,
    RE_UPLOAD_REQUIRED: 0,
  };

  snap.docs.forEach(d => {
    const data = d.data();
    Object.values(data).forEach(entry => {
      if (entry && entry.status && counts[entry.status] !== undefined) {
        counts[entry.status]++;
      }
    });
  });

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}
