import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { parseExcelFile, validateStudentData, generateSampleTemplate } from '../../utils/excelUtils';
import { importStudents, getAllStudents } from '../../firebase/studentService';
import toast from 'react-hot-toast';

export default function ImportStudents({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [importStats, setImportStats] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setImportStats(null);

    try {
      const students = await parseExcelFile(selectedFile);
      setParsedData(students);

      // Fetch existing students from database to check for duplicates
      const existing = await getAllStudents();
      const existingRegnos = existing.map(s => s.regNo);

      const val = validateStudentData(students, existingRegnos);
      setValidationResult(val);
      toast.success(`Parsed ${students.length} rows from Excel`);
    } catch (err) {
      toast.error('Failed to parse Excel file: ' + err.message);
      setFile(null);
      setParsedData([]);
      setValidationResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) {
      toast.error('No valid records to import');
      return;
    }

    setImporting(true);
    try {
      const result = await importStudents(validationResult.valid);
      setImportStats(result);
      toast.success(`Successfully imported ${result.success} students!`);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidationResult(null);
    setImportStats(null);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bulk Student Import (Excel)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload an Excel sheet to automatically create student accounts with initial passwords.
          </p>
        </div>
        <button
          onClick={generateSampleTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" /> Download Sample Template
        </button>
      </div>

      {/* Upload Box */}
      {!file && (
        <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-blue-200 hover:border-blue-400 text-center transition-colors">
          <input
            type="file"
            id="excel-upload"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Choose Excel File or Drag & Drop</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Supports .xlsx and .xls formats</p>
            <span className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all">
              Browse Excel File
            </span>
          </label>
        </div>
      )}

      {/* Parsing state */}
      {parsing && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Reading and validating student rows...</p>
        </div>
      )}

      {/* Validation Summary & Preview */}
      {validationResult && !importStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Rows in Sheet</p>
                <p className="text-2xl font-bold text-gray-900">{parsedData.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Ready to Import</p>
                <p className="text-2xl font-bold text-green-600">{validationResult.valid.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Rows with Errors / Duplicates</p>
                <p className="text-2xl font-bold text-red-600">{validationResult.errors.length}</p>
              </div>
            </div>
          </div>

          {/* Error list if any */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Rows requiring attention ({validationResult.errors.length})
              </h3>
              <p className="text-xs text-red-700 mb-4">
                These rows will be skipped during import until corrected in your Excel file:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {validationResult.errors.slice(0, 50).map((errRow, idx) => (
                  <div key={idx} className="bg-white/80 p-3 rounded-lg border border-red-100 text-xs">
                    <span className="font-bold text-gray-800">
                      Row {errRow._rowNum} (Reg: {errRow.regNo || 'Missing'} - {errRow.name || 'No Name'}):
                    </span>{' '}
                    <span className="text-red-600">{errRow.errors.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid preview table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Preview Valid Students (First 10)</h3>
              <span className="text-xs text-gray-400">Showing up to 10 rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Reg No</th>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">DOB</th>
                    <th className="px-4 py-3 font-semibold">Contact-1</th>
                    <th className="px-4 py-3 font-semibold">Contact-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {validationResult.valid.slice(0, 10).map((st) => (
                    <tr key={st.regNo} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-bold text-blue-900">{st.regNo}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{st.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                          {st.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{st.dob}</td>
                      <td className="px-4 py-2.5 text-gray-600">{st.contact1 || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{st.contact2 || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Choose Different File
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={importing || validationResult.valid.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing to Database...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Confirm & Import {validationResult.valid.length} Students
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Result */}
      {importStats && (
        <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Import Process Completed!</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Successfully created accounts for {importStats.success} students. Passwords have been generated from their phone numbers or date of birth.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
