import React from 'react';
import { User, Phone, Calendar, Tag, CheckCircle, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatDateTime, getApplicationStatus } from '../../utils/helpers';
import { getRequiredDocuments } from '../../utils/documentRequirements';

export default function StudentProfile({ studentData, documents }) {
  const currentStudent = studentData || {
    name: 'Student',
    regNo: '-',
    category: 'OPEN',
    contact1: '',
    contact2: '',
    dob: '',
    applicationStatus: 'NOT_STARTED',
    applyFeeConcession: false,
  };

  const requiredDocs = getRequiredDocuments(currentStudent.category, currentStudent.applyFeeConcession);
  const mandatoryDocs = requiredDocs.filter((d) => d.mandatory);
  const uploadedCount = Object.values(documents || {}).filter(
    (d) => d?.status && d.status !== 'NOT_UPLOADED'
  ).length;
  const approvedCount = Object.values(documents || {}).filter(
    (d) => d?.status === 'APPROVED'
  ).length;
  const appStatus = currentStudent.applicationStatus || getApplicationStatus(documents, requiredDocs);

  const progressPct = mandatoryDocs.length
    ? Math.min(100, Math.round((uploadedCount / mandatoryDocs.length) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="bg-white rounded-full p-1 shadow-lg flex-shrink-0">
            {documents?.photograph?.url ? (
              <img
                src={documents.photograph.url}
                alt="Student"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-12 h-12 text-blue-400" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{currentStudent.name}</h2>
            <p className="text-blue-200 text-sm mt-1">Registration No: {currentStudent.regNo}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                Category: {currentStudent.category}
              </span>
              <StatusBadge status={appStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: User, label: 'Full Name', value: currentStudent.name },
          { icon: Tag, label: 'Registration / Receipt Number', value: currentStudent.regNo },
          { icon: Tag, label: 'Category', value: currentStudent.category },
          { icon: Calendar, label: 'Date of Birth', value: currentStudent.dob || 'Not specified' },
          {
            icon: Phone,
            label: 'Student Mobile (Contact-1)',
            value: currentStudent.contact1 || 'Not specified',
          },
          {
            icon: Phone,
            label: 'Parent Mobile (Contact-2)',
            value: currentStudent.contact2 || 'Not specified',
          },
          {
            icon: Clock,
            label: 'Last Login',
            value: currentStudent.lastLogin ? formatDateTime(currentStudent.lastLogin) : 'Active now',
          },
          {
            icon: CheckCircle,
            label: 'Application Status',
            value: <StatusBadge status={appStatus} />,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-blue-50 p-2.5 rounded-lg flex-shrink-0">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{label}</p>
              <div className="font-semibold text-gray-800 text-sm truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" /> Document Verification Overview
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">{uploadedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Uploaded</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Approved (Correct)</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-600">{mandatoryDocs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Mandatory</p>
          </div>
        </div>

        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {uploadedCount} of {mandatoryDocs.length} mandatory documents uploaded ({progressPct}%)
        </p>
      </div>
    </div>
  );
}
