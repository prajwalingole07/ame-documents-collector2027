import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../firebase/studentService';
import { Tag, Users, Download } from 'lucide-react';
import { exportToExcel } from '../../utils/excelUtils';
import toast from 'react-hot-toast';

export default function CategoryWiseStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    getAllStudents()
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load students: ' + err.message);
        setLoading(false);
      });
  }, []);

  // Group by category
  const categoryGroups = students.reduce((acc, st) => {
    const cat = (st.category || 'UNCATEGORIZED').toUpperCase().trim();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(st);
    return acc;
  }, {});

  const handleExportCategory = (cat) => {
    const list = categoryGroups[cat] || [];
    const formatted = list.map((s) => ({
      'Reg No': s.regNo,
      'Student Name': s.name,
      Category: s.category,
      'Contact-1': s.contact1,
      'Contact-2': s.contact2,
      DOB: s.dob,
      Status: s.applicationStatus || 'NOT_STARTED',
    }));
    exportToExcel(formatted, `AME_Students_${cat}_Category.xlsx`);
    toast.success(`Exported ${cat} students list`);
  };

  const activeCategoryList = selectedCategory ? categoryGroups[selectedCategory] || [] : students;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Category-wise Student Breakdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Filter, inspect documents, and export students according to admission quota & reservation.
          </p>
        </div>
      </div>

      {/* Category Pills/Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCategory === null
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-100 hover:border-blue-200'
          }`}
        >
          <p className="text-xs font-semibold uppercase opacity-80">ALL</p>
          <p className="text-xl font-bold mt-1">{students.length}</p>
        </button>

        {Object.entries(categoryGroups).map(([cat, list]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-800 border-gray-100 hover:border-blue-200'
            }`}
          >
            <p className="text-xs font-semibold uppercase opacity-80 truncate">{cat}</p>
            <p className="text-xl font-bold mt-1">{list.length}</p>
          </button>
        ))}
      </div>

      {/* Selected Category Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">
            {selectedCategory ? `${selectedCategory} Category Students` : 'All Categories'}{' '}
            ({activeCategoryList.length})
          </h3>
          {selectedCategory && (
            <button
              onClick={() => handleExportCategory(selectedCategory)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export {selectedCategory} to Excel
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Mobile Contact</th>
                <th className="px-4 py-3">Date of Birth</th>
                <th className="px-4 py-3">Application Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    Loading category records...
                  </td>
                </tr>
              ) : activeCategoryList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No students found in this category.
                  </td>
                </tr>
              ) : (
                activeCategoryList.map((st) => (
                  <tr key={st.regNo} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-blue-900">{st.regNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{st.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {st.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{st.contact1 || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{st.dob}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-gray-700">
                        {st.applicationStatus || 'NOT_STARTED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
