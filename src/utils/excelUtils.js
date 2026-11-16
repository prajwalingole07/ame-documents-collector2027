import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Parse an Excel file and return an array of student objects.
 * @param {File} file
 * @returns {Promise<Array>}
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const headers = data[0]?.map(h => h?.toString().toLowerCase().trim()) || [];

        const rows = data.slice(1).map((row, idx) => {
          const student = { _rowNum: idx + 2 };
          headers.forEach((h, i) => {
            const val = row[i];
            student[h] = val !== undefined && val !== null ? val.toString().trim() : '';
          });
          return student;
        }).filter(r => {
          // Filter out rows where every value (except _rowNum) is empty
          return Object.entries(r).some(([k, v]) => k !== '_rowNum' && v !== '');
        });

        // Map to standard fields
        const students = rows.map(r => ({
          _rowNum: r._rowNum,
          regNo: r['regno'] || r['reg no'] || r['reg. no'] || r['registration number'] || r['reg no.'] || '',
          name: r['name of student'] || r['student name'] || r['name'] || r['full name'] || '',
          contact1: r['contact-1'] || r['contact1'] || r['mobile'] || r['phone'] || r['mobile no'] || r['contact no'] || '',
          contact2: r['contact-2'] || r['contact2'] || r['parent mobile'] || r['parent contact'] || r['alternate contact'] || '',
          dob: r['dob'] || r['date of birth'] || r['birth date'] || '',
          category: r['category'] || r['caste'] || r['caste category'] || '',
        }));

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/**
 * Validate student data array.
 * @param {Array} students
 * @param {Array} existingRegnos - reg numbers already in DB
 * @returns {{ valid: Array, errors: Array, duplicatesInFile: Array }}
 */
export function validateStudentData(students, existingRegnos = []) {
  const errors = [];
  const duplicatesInFile = [];
  const seenRegnos = new Set();
  const valid = [];

  students.forEach(s => {
    const rowErrors = [];

    if (!s.regNo || s.regNo.toString().trim() === '') {
      rowErrors.push('Registration Number is required');
    }
    if (!s.name || s.name.toString().trim() === '') {
      rowErrors.push('Student Name is required');
    }
    if (!s.category || s.category.toString().trim() === '') {
      rowErrors.push('Category is required');
    }
    if (!s.dob || s.dob.toString().trim() === '') {
      rowErrors.push('Date of Birth is required');
    }

    if (s.regNo) {
      if (seenRegnos.has(s.regNo.toString())) {
        duplicatesInFile.push(s.regNo.toString());
        rowErrors.push(`Duplicate Registration Number in file: ${s.regNo}`);
      }
      seenRegnos.add(s.regNo.toString());

      if (existingRegnos.includes(s.regNo.toString())) {
        rowErrors.push('Registration Number already exists in database');
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ ...s, errors: rowErrors });
    } else {
      valid.push(s);
    }
  });

  return { valid, errors, duplicatesInFile };
}

/**
 * Generate and download a sample Excel import template.
 */
export function generateSampleTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['regno', 'name of student', 'contact-1', 'contact-2', 'dob', 'category'],
    ['20270001', 'Rahul Patil',   '9876543210', '9876543211', '15/08/2005', 'OBC'],
    ['20270002', 'Priya Sharma',  '9123456789', '',           '20/03/2006', 'SC'],
    ['20270003', 'Amit Kumar',    '',           '9988776655', '01/01/2006', 'EWS'],
    ['20270004', 'Sneha Jadhav',  '8765432109', '8765432108', '10/11/2005', 'ST'],
    ['20270005', 'Ravi Deshmukh', '7654321098', '',           '25/06/2006', 'NT-B'],
  ]);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // regno
    { wch: 25 }, // name
    { wch: 15 }, // contact-1
    { wch: 15 }, // contact-2
    { wch: 12 }, // dob
    { wch: 10 }, // category
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'AME_Student_Import_Template.xlsx');
}

/**
 * Export any JSON array to an Excel file.
 * @param {Array} data
 * @param {string} filename
 */
export function exportToExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), filename);
}

/**
 * Export student login credentials to Excel.
 * @param {Array} students - must include initialPassword or use reset flag
 */
export function exportStudentCredentials(students) {
  const data = students.map(s => ({
    'Registration Number': s.regNo,
    'Student Name':        s.name,
    'Login ID':            s.regNo,
    'Password (Initial)':  s.initialPassword || '(reset by admin)',
    'Category':            s.category,
    'Contact-1':           s.contact1,
    'Contact-2':           s.contact2,
  }));
  exportToExcel(data, 'AME_Student_Credentials.xlsx');
}

/**
 * Export document status report to Excel.
 * @param {Array} reportData - array of { regNo, name, category, ...docStatuses }
 */
export function exportDocumentReport(reportData) {
  exportToExcel(reportData, `AME_Document_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
