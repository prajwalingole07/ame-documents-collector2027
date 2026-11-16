// ============================================================
// AME Student Portal 2027 - Document Requirements
// ============================================================

export const COMMON_DOCUMENTS = [
  { key: 'ssc_marksheet',       label: 'SSC (10th) Marksheet',                     mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'ssc_certificate',     label: 'SSC (10th) Passing Certificate',            mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'hsc_marksheet',       label: 'HSC (12th) Marksheet',                     mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'hsc_certificate',     label: 'HSC (12th) Passing Certificate',            mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'cet_scorecard',       label: 'MHT-CET / JEE / Diploma CET Score Card',   mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'domicile_cert',       label: 'Domicile / Nationality Certificate',        mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'leaving_cert',        label: 'School Leaving Certificate',                mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'birth_cert',          label: 'Birth Certificate / Age Proof',             mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'aadhar_card',         label: 'Aadhaar Card',                              mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'income_cert',         label: 'Income Certificate (Family)',               mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'caste_cert',          label: 'Caste Certificate',                         mandatory: false, accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'caste_validity',      label: 'Caste Validity Certificate',                mandatory: false, accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'gap_cert',            label: 'Gap Certificate (if applicable)',            mandatory: false, accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'photo',               label: 'Passport Size Photograph',                  mandatory: true,  accept: '.jpg,.jpeg,.png' },
  { key: 'signature',           label: 'Scanned Signature',                         mandatory: true,  accept: '.jpg,.jpeg,.png' },
];

export const SC_ST_DOCUMENTS = [
  { key: 'caste_cert',          label: 'SC/ST Caste Certificate',                   mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'caste_validity',      label: 'Caste Validity Certificate',                mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
];

export const OBC_DOCUMENTS = [
  { key: 'caste_cert',          label: 'OBC Caste Certificate',                     mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'caste_validity',      label: 'Caste Validity Certificate',                mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'ncl_cert',            label: 'Non-Creamy Layer (NCL) Certificate',        mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
];

export const EWS_DOCUMENTS = [
  { key: 'ews_cert',            label: 'EWS Certificate',                           mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
];

export const DEFENCE_DOCUMENTS = [
  { key: 'defence_cert',        label: 'Defence Service Certificate',               mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'relation_cert',       label: 'Relationship Certificate with Defence Personnel', mandatory: true, accept: '.pdf,.jpg,.jpeg,.png' },
];

export const ORPHAN_DOCUMENTS = [
  { key: 'orphan_cert',         label: 'Orphan Certificate from Competent Authority', mandatory: true, accept: '.pdf,.jpg,.jpeg,.png' },
];

export const PWD_DOCUMENTS = [
  { key: 'pwd_cert',            label: 'Disability Certificate (PWD)',              mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
];

export const FEE_CONCESSION_DOCUMENTS = [
  { key: 'fee_income_cert',     label: 'Income Certificate for Fee Concession',    mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'fee_caste_cert',      label: 'Caste Certificate for Fee Concession',     mandatory: false, accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'fee_bank_passbook',   label: 'Bank Passbook (First Page)',               mandatory: true,  accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'fee_ration_card',     label: 'Ration Card',                              mandatory: false, accept: '.pdf,.jpg,.jpeg,.png' },
];

// ---- Helpers ----------------------------------------------------------------

function normalizeCategory(category) {
  return (category || '').toString().toUpperCase().trim();
}

/**
 * Map a raw category string to a canonical group.
 * @param {string} category
 * @returns {'OPEN'|'SC'|'ST'|'OBC'|'VJ'|'NT'|'SBC'|'SEBC'|'EWS'|'DEFENCE'|'ORPHAN'|'PWD'}
 */
export function getCategoryGroup(category) {
  const c = normalizeCategory(category);

  if (c === 'SC' || c === 'SC(A)') return 'SC';
  if (c === 'ST' || c === 'ST(A)') return 'ST';

  if (
    c === 'OBC' || c === 'OBC-A' || c === 'OBC-B' ||
    c === 'OBC(A)' || c === 'OBC(B)'
  ) return 'OBC';

  if (c === 'VJ' || c === 'VJ(A)' || c === 'DT' || c === 'VJ-DT') return 'VJ';

  if (
    c === 'NT' || c === 'NT-A' || c === 'NT-B' || c === 'NT-C' || c === 'NT-D' ||
    c === 'NT(A)' || c === 'NT(B)' || c === 'NT(C)' || c === 'NT(D)'
  ) return 'NT';

  if (c === 'SBC' || c === 'SBC(A)') return 'SBC';
  if (c === 'SEBC') return 'SEBC';
  if (c === 'EWS' || c === 'E.W.S.' || c === 'GEN-EWS') return 'EWS';
  if (c === 'DEFENCE' || c === 'DEF' || c.startsWith('DEF-')) return 'DEFENCE';
  if (c === 'ORPHAN' || c === 'ORP') return 'ORPHAN';
  if (c === 'PWD' || c === 'PH' || c === 'HANDICAPPED') return 'PWD';

  // Default: OPEN (GEN, GENERAL, OPEN, blank, unrecognised)
  return 'OPEN';
}

/**
 * Build the full list of required documents for a student.
 * Common docs are always included; category-specific docs are merged in,
 * replacing any matching key so there's no duplication.
 * @param {string} category - raw category string
 * @param {boolean} applyingForFeeConcession
 * @returns {Array}
 */
export function getRequiredDocuments(category, applyingForFeeConcession = false) {
  const group = getCategoryGroup(category);

  // Start with common docs
  const docMap = new Map(COMMON_DOCUMENTS.map(d => [d.key, { ...d }]));

  // Merge category-specific docs
  const addDocs = (arr) => arr.forEach(d => docMap.set(d.key, { ...d }));

  switch (group) {
    case 'SC':      addDocs(SC_ST_DOCUMENTS); break;
    case 'ST':      addDocs(SC_ST_DOCUMENTS); break;
    case 'OBC':     addDocs(OBC_DOCUMENTS);   break;
    case 'VJ':      addDocs(OBC_DOCUMENTS);   break;  // VJ follows OBC rules in MH
    case 'NT':      addDocs(OBC_DOCUMENTS);   break;  // NT follows OBC rules
    case 'SBC':     addDocs(OBC_DOCUMENTS);   break;
    case 'SEBC':    addDocs(OBC_DOCUMENTS);   break;
    case 'EWS':     addDocs(EWS_DOCUMENTS);   break;
    case 'DEFENCE': addDocs(DEFENCE_DOCUMENTS); break;
    case 'ORPHAN':  addDocs(ORPHAN_DOCUMENTS);  break;
    case 'PWD':     addDocs(PWD_DOCUMENTS);     break;
    default: break; // OPEN — no extra docs beyond common
  }

  // Fee concession documents
  if (applyingForFeeConcession) {
    addDocs(FEE_CONCESSION_DOCUMENTS);
  }

  return Array.from(docMap.values());
}

/**
 * Count mandatory documents for a given category / concession combination.
 * @param {string} category
 * @param {boolean} applyingForFeeConcession
 * @returns {number}
 */
export function getMandatoryCount(category, applyingForFeeConcession = false) {
  return getRequiredDocuments(category, applyingForFeeConcession).filter(d => d.mandatory).length;
}
