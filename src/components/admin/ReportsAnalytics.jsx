import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../firebase/studentService';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, TrendingUp, Users, FileCheck2, AlertCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#9333ea', '#06b6d4', '#f97316'];

export default function ReportsAnalytics() {
  const [students, setStudents] = useState([]);
  const [docStats, setDocStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const studentList = await getAllStudents();
        setStudents(studentList);

        const snap = await getDocs(collection(db, 'student_documents'));
        let approved = 0, pending = 0, rejected = 0;
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          Object.values(data).forEach((val) => {
            if (val && typeof val === 'object' && val.status) {
              if (val.status === 'APPROVED') approved++;
              else if (val.status === 'REJECTED' || val.status === 'RE_UPLOAD_REQUIRED') rejected++;
              else if (val.status === 'UPLOADED' || val.status === 'UNDER_VERIFICATION') pending++;
            }
          });
        });
        setDocStats({ approved, pending, rejected });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Category distribution data
  const categoryCounts = students.reduce((acc, s) => {
    const c = (s.category || 'OTHER').toUpperCase().trim();
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Status breakdown data
  const statusCounts = students.reduce((acc, s) => {
    const st = s.applicationStatus || 'NOT_STARTED';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count,
  }));

  const docDistributionData = [
    { name: 'Approved', value: docStats.approved, color: '#16a34a' },
    { name: 'Pending Review', value: docStats.pending, color: '#eab308' },
    { name: 'Rejected / Re-upload', value: docStats.rejected, color: '#dc2626' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Scrutiny Reports & Admission Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time insights across student registrations, category quotas, and document approval velocity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Category-wise Student Quota Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Status Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-green-600" /> Document Verification Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docDistributionData}>
                <XAxis dataKey="name" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  {docDistributionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
