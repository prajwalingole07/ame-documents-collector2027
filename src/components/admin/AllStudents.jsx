import React, { useState, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  Download,
  Filter,
  UserPlus,
  Trash,
  AlertTriangle,
} from 'lucide-react';
import {
  getAllStudents,
  updateStudent,
  deleteStudent,
  enableDisableStudent,
} from '../../firebase/studentService';
import { resetStudentPassword } from '../../firebase/authService';
import { exportToExcel } from '../../utils/excelUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import toast from 'react-hot-toast';

export default function AllStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(null);

  // Multi-select state
  const [selectedRegNos, setSelectedRegNos] = useState(new Set());

  // Delete all & Delete selected dialogs
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Manual Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    regNo: '',
    name: '',
    category: 'OPEN',
    contact1: '',
    contact2: '',
    dob: '',
  });
  const [addingStudent, setAddingStudent] = useState(false);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete single & Reset Password
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [resettingStudent, setResettingStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.warn('Failed to load students:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    toast.success('Copied to clipboard');
  };

  const handleToggleSelectAll = () => {
    if (selectedRegNos.size === filtered.length && filtered.length > 0) {
      setSelectedRegNos(new Set());
    } else {
      setSelectedRegNos(new Set(filtered.map((s) => s.regNo.toString())));
    }
  };

  const handleToggleSelectOne = (regNo) => {
    const next = new Set(selectedRegNos);
    const regStr = regNo.toString();
    if (next.has(regStr)) next.delete(regStr);
    else next.add(regStr);
    setSelectedRegNos(next);
  };

  // Delete Selected Students
  const handleDeleteSelectedConfirm = async () => {
    setDeletingBulk(true);
    try {
      const regList = Array.from(selectedRegNos);
      for (const reg of regList) {
        await deleteStudent(reg);
      }
      setSelectedRegNos(new Set());
      setShowDeleteSelectedDialog(false);
      toast.success(`Deleted ${regList.length} selected student(s)`);
      fetchStudents();
    } catch (err) {
      toast.error('Bulk delete failed: ' + err.message);
    } finally {
      setDeletingBulk(false);
    }
  };

  // Delete ALL Students Data
  const handleDeleteAllConfirm = async () => {
    setDeletingBulk(true);
    try {
      for (const s of students) {
        await deleteStudent(s.regNo);
      }
      localStorage.removeItem('ame_local_students');
      localStorage.removeItem('ame_all_documents_registry');
      setSelectedRegNos(new Set());
      setShowDeleteAllDialog(false);
      toast.success('All student records & documents deleted. You can now import fresh Excel or add new students.');
      fetchStudents();
    } catch (err) {
      toast.error('Delete all failed: ' + err.message);
    } finally {
      setDeletingBulk(false);
    }
  };

  // Manual Add New Student
  const handleAddNewStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.regNo.trim() || !newStudent.name.trim()) {
      toast.error('Registration number and Student Name are required');
      return;
    }

    setAddingStudent(true);
    try {
      const local = JSON.parse(localStorage.getItem('ame_local_students') || '[]');
      const exists = local.some((s) => s.regNo.toString() === newStudent.regNo.trim());
      if (exists) {
        toast.error(`Student with Reg No ${newStudent.regNo} already exists`);
        setAddingStudent(false);
        return;
      }

      const initialPassword = newStudent.contact1.trim() || newStudent.dob.replace(/[^0-9]/g, '') || 'ame2027';
      const studentObj = {
        regNo: newStudent.regNo.trim(),
        name: newStudent.name.trim(),
        category: newStudent.category.trim() || 'OPEN',
        contact1: newStudent.contact1.trim(),
        contact2: newStudent.contact2.trim(),
        dob: newStudent.dob.trim(),
        initialPassword,
        isDisabled: false,
        applicationStatus: 'NOT_STARTED',
        createdAt: new Date().toISOString(),
      };

      local.push(studentObj);
      localStorage.setItem('ame_local_students', JSON.stringify(local));

      // Try update in Firestore
      try {
        await updateStudent(studentObj.regNo, studentObj);
      } catch (e) {}

      toast.success(`Student ${studentObj.name} added successfully! Initial Password: ${initialPassword}`);
      setShowAddModal(false);
      setNewStudent({ regNo: '', name: '', category: 'OPEN', contact1: '', contact2: '', dob: '' });
      fetchStudents();
    } catch (err) {
      toast.error('Add student failed: ' + err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleEditClick = (st) => {
    setEditingStudent(st);
    setEditFormData({
      name: st.name || '',
      category: st.category || '',
      dob: st.dob || '',
      contact1: st.contact1 || '',
      contact2: st.contact2 || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      await updateStudent(editingStudent.regNo, editFormData);
      toast.success('Student details updated successfully!');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update student: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudent(deletingStudent.regNo);
      toast.success(`Student ${deletingStudent.name} deleted.`);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleToggleStatus = async (st) => {
    try {
      await enableDisableStudent(st.regNo, !st.isDisabled);
      toast.success(`Account ${st.isDisabled ? 'enabled' : 'disabled'}`);
      fetchStudents();
    } catch (err) {
      toast.error('Status change error: ' + err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingStudent || !newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    try {
      await resetStudentPassword(resettingStudent.regNo, newPassword.trim());
      toast.success(`Password reset for ${resettingStudent.name}`);
      setResettingStudent(null);
      setNewPassword('');
      fetchStudents();
    } catch (err) {
      toast.error('Password reset failed: ' + err.message);
    }
  };

  const handleExportRoster = () => {
    const rows = students.map((s) => ({
      'Registration Number': s.regNo,
      'Student Name': s.name,
      Category: s.category,
      'Login ID': s.regNo,
      'Initial Password': s.initialPassword || s.contact1 || s.dob || 'ame2027',
      'Student Mobile (1)': s.contact1,
      'Parent Mobile (2)': s.contact2,
      'Date of Birth': s.dob,
      'Application Status': s.applicationStatus || 'NOT_STARTED',
      'Account Disabled': s.isDisabled ? 'YES' : 'NO',
    }));
    exportToExcel(rows, 'AME_Students_Roster_With_Credentials.xlsx');
    toast.success('Exported complete student roster with passwords');
  };

  const filtered = students.filter((st) => {
    const q = search.toLowerCase();
    const matchSearch =
      st.name?.toLowerCase().includes(q) ||
      st.regNo?.toLowerCase().includes(q) ||
      st.contact1?.includes(q) ||
      st.category?.toLowerCase().includes(q);
    const matchCategory =
      categoryFilter === 'ALL' || st.category?.toUpperCase() === categoryFilter.toUpperCase();
    const matchStatus = statusFilter === 'ALL' || st.applicationStatus === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const categories = Array.from(new Set(students.map((s) => s.category).filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Search and Action Bar */}
      <div className="glass-panel rounded-3xl p-5 shadow-sm border border-white/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, registration number, mobile, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white/90 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-2xl px-3 py-2 bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-2xl px-3 py-2 bg-white/90 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Manually Add Student Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={handleExportRoster}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 text-slate-700 hover:bg-white rounded-2xl text-xs font-bold border border-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bulk Delete Controls Bar */}
      <div className="glass-panel rounded-2xl px-5 py-3 shadow-sm border border-white/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
            <input
              type="checkbox"
              checked={selectedRegNos.size > 0 && selectedRegNos.size === filtered.length}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span>Select All ({selectedRegNos.size} selected)</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete Selected Button */}
          {selectedRegNos.size > 0 && (
            <button
              onClick={() => setShowDeleteSelectedDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Delete Selected ({selectedRegNos.size})</span>
            </button>
          )}

          {/* Delete ALL Students Data Button */}
          {students.length > 0 && (
            <button
              onClick={() => setShowDeleteAllDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold transition-all"
            >
              <Trash className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete All Students Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Combined Students & Credentials Table */}
      <div className="glass-panel rounded-3xl border border-white/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRegNos.size > 0 && selectedRegNos.size === filtered.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                </th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Receipt No (Login ID)</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Mobile Contact</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Scrutiny Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    No students currently found. You can import from Excel or click <strong>Add Student</strong> above!
                  </td>
                </tr>
              ) : (
                filtered.map((st) => {
                  const currentPassword = st.initialPassword || st.contact1 || st.dob || 'ame2027';
                  const isChecked = selectedRegNos.has(st.regNo.toString());
                  return (
                    <tr
                      key={st.regNo}
                      className={`transition-colors ${
                        isChecked ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(st.regNo)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {st.name}
                        {st.isDisabled && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            DISABLED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-900">{st.regNo}</span>
                          <button
                            onClick={() => handleCopy(st.regNo, `id_${st.regNo}`)}
                            title="Copy Login ID"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                          >
                            {copiedKey === `id_${st.regNo}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-700 font-semibold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] shadow-sm">
                            {currentPassword}
                          </span>
                          <button
                            onClick={() => handleCopy(currentPassword, `pwd_${st.regNo}`)}
                            title="Copy Password"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                          >
                            {copiedKey === `pwd_${st.regNo}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-blue-200">
                          {st.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{st.contact1 || '-'}</div>
                        {st.contact2 && (
                          <div className="text-[10px] text-slate-400">P: {st.contact2}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{st.dob || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={st.applicationStatus || 'NOT_STARTED'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditClick(st)}
                            title="Edit Details"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setResettingStudent(st);
                              setNewPassword('');
                            }}
                            title="Reset Password"
                            className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title={st.isDisabled ? 'Enable Account' : 'Disable Account'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              st.isDisabled
                                ? 'hover:bg-green-50 text-green-600'
                                : 'hover:bg-orange-50 text-orange-600'
                            }`}
                          >
                            {st.isDisabled ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserX className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeletingStudent(st)}
                            title="Delete Student"
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student (Manual Entry)"
      >
        <form onSubmit={handleAddNewStudent} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt / Registration No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 20270050"
                value={newStudent.regNo}
                onChange={(e) => setNewStudent({ ...newStudent, regNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. OBC, SC, ST, EWS, OPEN"
                value={newStudent.category}
                onChange={(e) => setNewStudent({ ...newStudent, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Student Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rameshwar Patil"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Mobile (Contact-1)
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 (acts as password)"
                value={newStudent.contact1}
                onChange={(e) => setNewStudent({ ...newStudent, contact1: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent Mobile (Contact-2)
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={newStudent.contact2}
                onChange={(e) => setNewStudent({ ...newStudent, contact2: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date of Birth (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="e.g. 15/08/2006"
              value={newStudent.dob}
              onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingStudent}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
            >
              {addingStudent ? 'Adding...' : 'Add Student Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete ALL Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        title="⚠️ Delete All Students Data?"
        message="This will completely clear ALL student accounts and uploaded documents. Once deleted, you can immediately upload a fresh Excel file or add new students."
        confirmText="Yes, Delete All Data"
        danger={true}
        loading={deletingBulk}
        onConfirm={handleDeleteAllConfirm}
        onCancel={() => setShowDeleteAllDialog(false)}
      />

      {/* Delete Selected Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteSelectedDialog}
        title={`Delete ${selectedRegNos.size} Selected Students?`}
        message="Are you sure you want to remove the selected student accounts? Their document records will also be erased."
        confirmText="Yes, Delete Selected"
        danger={true}
        loading={deletingBulk}
        onConfirm={handleDeleteSelectedConfirm}
        onCancel={() => setShowDeleteSelectedDialog(false)}
      />

      {/* Edit Student Modal */}
      <Modal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title={`Edit Student – ${editingStudent?.regNo}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={editFormData.category || ''}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="text"
                required
                value={editFormData.dob || ''}
                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Mobile</label>
              <input
                type="text"
                value={editFormData.contact1 || ''}
                onChange={(e) => setEditFormData({ ...editFormData, contact1: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Mobile</label>
              <input
                type="text"
                value={editFormData.contact2 || ''}
                onChange={(e) => setEditFormData({ ...editFormData, contact2: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Single Student Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingStudent)}
        title="Delete Student Record"
        message={`Are you sure you want to delete ${deletingStudent?.name} (Reg No: ${deletingStudent?.regNo})?`}
        confirmText="Yes, Delete"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />

      {/* Password Reset Modal */}
      <Modal
        isOpen={Boolean(resettingStudent)}
        onClose={() => setResettingStudent(null)}
        title={`Reset Password – ${resettingStudent?.name}`}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Set a new custom password for student registration number{' '}
            <strong>{resettingStudent?.regNo}</strong>:
          </p>
          <input
            type="text"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setResettingStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
            >
              Update Password
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
