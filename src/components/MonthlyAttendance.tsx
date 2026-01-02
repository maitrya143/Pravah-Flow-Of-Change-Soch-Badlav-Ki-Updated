
import React, { useState, useMemo } from 'react';
import { User, MonthlyReportData } from '../types';
import { DataService } from '../services/dataService';
import { PDFService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';
import { Calendar, Download, Filter, BarChart2, FileSpreadsheet, Share2 } from 'lucide-react';

interface MonthlyAttendanceProps {
  user: User;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyAttendance: React.FC<MonthlyAttendanceProps> = ({ user }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedClass, setSelectedClass] = useState('All');

  // Get unique classes from student list for dropdown
  const availableClasses = useMemo(() => {
    const students = DataService.getStudents();
    const classes = new Set(students.filter(s => s.centerId === user.centerId).map(s => s.classLevel));
    return ['All', ...Array.from(classes).sort()];
  }, [user.centerId]);

  // Generate Report Data
  const reportData: MonthlyReportData = useMemo(() => {
    return DataService.getMonthlyReport(user.centerId, selectedMonth, selectedYear, selectedClass);
  }, [user.centerId, selectedMonth, selectedYear, selectedClass]);

  const handleDownloadPDF = async () => {
    const doc = await PDFService.generateMonthlyReport(reportData, user);
    doc.save(`Attendance_${reportData.month}_${reportData.year}_${reportData.className}.pdf`);
  };

  const handleSharePDF = async () => {
    const doc = await PDFService.generateMonthlyReport(reportData, user);
    await PDFService.shareFile(doc, `Attendance_${reportData.month}_${reportData.year}_${reportData.className}.pdf`);
  };

  const handleDownloadExcel = () => {
    ExcelService.generateMonthlyExcel(reportData, user);
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600 bg-green-50';
    if (percent >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Monthly Attendance Overview</h2>
          <p className="text-stone-500 text-sm">Analytics and student performance reports.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
             <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                <Filter size={16} /> Class
             </label>
             <select 
               value={selectedClass} 
               onChange={(e) => setSelectedClass(e.target.value)}
               className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
             >
               {availableClasses.map(cls => (
                 <option key={cls} value={cls}>{cls}</option>
               ))}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Month
             </label>
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
               className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
             >
               {MONTHS.map((m, idx) => (
                 <option key={m} value={idx}>{m}</option>
               ))}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Year
             </label>
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(parseInt(e.target.value))}
               className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
             >
               {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
             <h3 className="text-emerald-800 font-semibold mb-1">Working Days</h3>
             <span className="text-3xl font-bold text-emerald-900">{reportData.workingDays}</span>
             <p className="text-xs text-emerald-600 mt-1">Days with attendance recorded</p>
         </div>
         <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
             <h3 className="text-blue-800 font-semibold mb-1">Class Average</h3>
             <span className="text-3xl font-bold text-blue-900">{Math.round(reportData.averageAttendance)}%</span>
             <p className="text-xs text-blue-600 mt-1">Overall attendance percentage</p>
         </div>
         <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 flex flex-col items-center justify-center text-center">
             <h3 className="text-stone-800 font-semibold mb-1">Total Students</h3>
             <span className="text-3xl font-bold text-stone-900">{reportData.totalStudents}</span>
             <p className="text-xs text-stone-600 mt-1">Students in {selectedClass}</p>
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <BarChart2 className="text-emerald-600" size={20} />
                 <h3 className="font-bold text-stone-800">Student Attendance Report</h3>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={reportData.workingDays === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Download size={16} /> PDF
                </button>
                <button 
                  onClick={handleSharePDF} 
                  disabled={reportData.workingDays === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Share2 size={16} /> Share
                </button>
                <button 
                  onClick={handleDownloadExcel} 
                  disabled={reportData.workingDays === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={16} /> CSV/Excel
                </button>
             </div>
        </div>

        <div className="overflow-x-auto">
           {reportData.studentStats.length === 0 ? (
               <div className="p-8 text-center text-stone-400">
                   No students found for this class filter.
               </div>
           ) : (
               <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-600 font-semibold text-sm">
                     <tr>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Student ID</th>
                        <th className="p-4 text-center">Days Present</th>
                        <th className="p-4 text-right">Percentage</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                     {reportData.studentStats.map((stat) => {
                         const colorClass = getPercentageColor(stat.percentage);
                         return (
                             <tr key={stat.studentId} className="hover:bg-stone-50">
                                 <td className="p-4 font-medium text-stone-800">{stat.name}</td>
                                 <td className="p-4 text-stone-500 font-mono text-sm">{stat.studentId}</td>
                                 <td className="p-4 text-center font-semibold text-stone-700">
                                     {stat.presentDays} <span className="text-stone-400 font-normal text-xs">/ {reportData.workingDays}</span>
                                 </td>
                                 <td className="p-4 text-right">
                                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                                        {Math.round(stat.percentage)}%
                                     </span>
                                 </td>
                             </tr>
                         );
                     })}
                  </tbody>
               </table>
           )}
        </div>
      </div>
    </div>
  );
};
