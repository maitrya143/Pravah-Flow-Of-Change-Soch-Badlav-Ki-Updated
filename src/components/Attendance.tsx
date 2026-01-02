
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { PDFService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';
import { User, AttendanceRecord, Student, StudentPerformance } from '../types';
import { 
  Check, Search, Save, Camera, XCircle, FileSpreadsheet, Download, 
  Share2, Edit3, Award, AlertTriangle, User as UserIcon, 
  BarChart2, ArrowLeft, TrendingUp, FileText 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AttendanceProps {
  mode: 'MANUAL' | 'QR';
  user?: User;
  initialData?: AttendanceRecord | null;
}

export const Attendance: React.FC<AttendanceProps> = ({ mode, user, initialData }) => {
  const [students] = useState(DataService.getStudents());
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set(initialData?.presentStudentIds || []));
  const [searchTerm, setSearchTerm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);
  const scannerRef = useRef<any>(null);

  const performanceAnalytics = useMemo(() => {
    if (!lastScannedStudent) return null;
    return DataService.getPerformanceAnalytics(lastScannedStudent.id);
  }, [lastScannedStudent]);

  const performanceHistory = useMemo(() => {
    if (!lastScannedStudent) return [];
    return DataService.getPerformanceByStudent(lastScannedStudent.id);
  }, [lastScannedStudent]);

  const trendData = useMemo(() => {
    return performanceHistory.map(h => ({
      name: h.testName,
      avg: h.scores.reduce((sum, s) => sum + s.score, 0) / h.scores.length
    })).sort((a,b) => a.name.localeCompare(b.name));
  }, [performanceHistory]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    setPresentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMarkAttendanceFromQR = () => {
    if (lastScannedStudent) {
      setPresentIds(prev => {
        const newSet = new Set(prev);
        newSet.add(lastScannedStudent.id);
        return newSet;
      });
      setLastScannedStudent(null);
      setShowPerformanceDetail(false);
    }
  };

  const handleSubmit = () => {
    DataService.saveAttendance({
        id: initialData?.id, 
        date: initialData?.date || new Date().toISOString(),
        presentStudentIds: Array.from(presentIds),
        mode: mode,
        totalStudents: students.length
    });
    setSubmitted(true);
  };

  const generatePDF = async () => {
      const doc = await PDFService.createDocument(initialData ? 'Updated Attendance Report' : 'Attendance Report', user || null);
      let y = 50;
      
      y = PDFService.addSectionHeader(doc, 'Daily Summary', y);
      PDFService.addField(doc, 'Date', new Date(initialData?.date || Date.now()).toLocaleDateString(), 15, y);
      PDFService.addField(doc, 'Mode', mode, 60, y);
      PDFService.addField(doc, 'Total Students', students.length.toString(), 110, y);
      PDFService.addField(doc, 'Present', `${presentIds.size} (${Math.round((presentIds.size / students.length) * 100)}%)`, 160, y);
      y += 20;

      y = PDFService.addSectionHeader(doc, 'Attendance Log', y);
      y += 5;

      const tableData = students.map((s, i) => [
          (i + 1).toString(),
          s.name,
          s.classLevel,
          s.id,
          presentIds.has(s.id) ? 'Present' : 'Absent'
      ]);

      PDFService.drawTable(
          doc, 
          ['#', 'Student Name', 'Class', 'Student ID', 'Status'], 
          tableData, 
          y,
          [15, 25, 85, 115, 160]
      );

      PDFService.addFooter(doc);
      return doc;
  };

  const handleDownloadReport = async () => {
      const doc = await generatePDF();
      doc.save(`Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleShareReport = async () => {
      const doc = await generatePDF();
      await PDFService.shareFile(doc, `Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
                const student = students.find(s => s.id === decodedText);
                if (student) {
                    setLastScannedStudent(student);
                    // We DO NOT auto-mark here anymore. User will choose.
                }
            },
            () => {}
        ).catch(() => {
            setScanning(false);
            alert("Error accessing camera.");
        });
    }, 100);
  };

  const stopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
              scannerRef.current = null;
              setScanning(false);
              setLastScannedStudent(null);
              setShowPerformanceDetail(false);
          });
      } else {
          setScanning(false);
      }
  };

  useEffect(() => {
      return () => {
          if (scannerRef.current) {
             try { scannerRef.current.stop().then(() => scannerRef.current.clear()); } catch (e) {}
          }
      };
  }, []);

  if (submitted) {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
            <div className="p-4 bg-green-100 rounded-full">
                <Check className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800">{initialData ? 'Corrections Saved!' : 'Attendance Saved!'}</h2>
            <div className="flex space-x-3">
                <button onClick={handleDownloadReport} className="text-white bg-emerald-600 px-4 py-2 rounded shadow-sm flex items-center space-x-1"><Download size={18}/><span>PDF</span></button>
                <button onClick={handleShareReport} className="text-white bg-blue-600 px-4 py-2 rounded shadow-sm flex items-center space-x-1"><Share2 size={18}/><span>Share</span></button>
                {!initialData && <button onClick={() => setSubmitted(false)} className="text-stone-600 px-4 py-2 border rounded hover:bg-stone-50">Back</button>}
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 h-full flex flex-col relative">
      <div className={`p-6 border-b ${initialData ? 'bg-amber-50' : 'bg-white'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-center space-x-2">
            {initialData && <Edit3 className="text-amber-600" size={20} />}
            <h2 className="text-xl font-bold text-stone-800">{initialData ? 'Correct Attendance' : (mode === 'QR' ? 'QR Attendance' : 'Manual Attendance')}</h2>
        </div>
        <div className="flex items-center space-x-2">
            {mode === 'QR' ? (
                 !scanning ? (
                    <button onClick={startScanner} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                        <Camera size={20} /><span>Start Scanner</span>
                    </button>
                 ) : (
                    <button onClick={stopScanner} className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-sm transition-colors">
                        <XCircle size={20} /><span>Stop Scanner</span>
                    </button>
                 )
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-stone-400" size={20} />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
            )}
        </div>
      </div>
      
      {/* QR SUCCESS OVERLAY / OPTION MODAL */}
      {lastScannedStudent && !showPerformanceDetail && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-100">
                  <div className="bg-emerald-600 p-6 text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
                          <UserIcon size={32} />
                      </div>
                      <h3 className="text-xl font-bold">{lastScannedStudent.name}</h3>
                      <p className="text-emerald-100 text-sm font-mono">{lastScannedStudent.id}</p>
                  </div>
                  
                  <div className="p-6 space-y-3">
                      <p className="text-center text-stone-500 text-sm mb-4">Student identified. What would you like to do?</p>
                      
                      <button 
                        onClick={handleMarkAttendanceFromQR}
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg"
                      >
                        <Check size={20} />
                        <span>Mark Attendance</span>
                      </button>

                      <button 
                        onClick={() => setShowPerformanceDetail(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        <BarChart2 size={20} />
                        <span>View Performance</span>
                      </button>

                      <button 
                        onClick={() => setLastScannedStudent(null)}
                        className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                      >
                        Cancel / Scan Again
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* PERFORMANCE DETAIL VIEW WITHIN ATTENDANCE */}
      {lastScannedStudent && showPerformanceDetail && (
          <div className="absolute inset-0 z-50 flex flex-col bg-stone-50 animate-fade-in overflow-y-auto custom-scrollbar">
              <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between shadow-sm">
                  <button onClick={() => setShowPerformanceDetail(false)} className="flex items-center text-stone-600 font-medium">
                      <ArrowLeft size={20} className="mr-2" /> Back to Options
                  </button>
                  <h3 className="font-bold text-stone-800">Student Profile</h3>
              </div>

              <div className="p-6 space-y-6">
                  {/* Basic Profile Card */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UserIcon size={32} className="text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-bold text-stone-800">{lastScannedStudent.name}</h4>
                      <div className="flex justify-center gap-2 mt-2">
                        <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-bold">{lastScannedStudent.id}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">{lastScannedStudent.classLevel}</span>
                      </div>
                  </div>

                  {/* Analytics Summary */}
                  {performanceAnalytics && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Average</span>
                            <div className="text-2xl font-black text-emerald-600">{Math.round(performanceAnalytics.average)}%</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Strongest</span>
                            <div className="text-sm font-bold text-stone-800 truncate">{performanceAnalytics.strongest?.subject || 'N/A'}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">{performanceAnalytics.strongest ? Math.round(performanceAnalytics.strongest.avg) + '%' : ''}</div>
                        </div>
                        {performanceAnalytics.needsAttention && (
                            <div className="col-span-2 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-3">
                                <AlertTriangle className="text-red-600" size={24} />
                                <div>
                                    <div className="text-xs font-bold text-red-800 uppercase">Academic Attention Required</div>
                                    <div className="text-[10px] text-red-600">Performance below safety threshold (40%) in multiple tests.</div>
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  {/* Trend Graph */}
                  {trendData.length > 1 && (
                      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                          <h5 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> Performance Trend
                          </h5>
                          <div className="h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={trendData}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                      <XAxis dataKey="name" hide />
                                      <YAxis hide domain={[0, 100]} />
                                      <Tooltip />
                                      <Line type="monotone" dataKey="avg" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', r: 3 }} />
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  )}

                  {/* Test History List */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                      <div className="p-3 bg-stone-50 border-b">
                          <h5 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Test Records</h5>
                      </div>
                      <div className="divide-y divide-stone-100">
                          {performanceHistory.length > 0 ? (
                              performanceHistory.slice(0, 3).map(h => (
                                  <div key={h.id} className="p-3 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <FileText size={16} className="text-stone-400" />
                                          <div>
                                              <div className="text-sm font-bold text-stone-800">{h.testName}</div>
                                              <div className="text-[10px] text-stone-500">{h.date}</div>
                                          </div>
                                      </div>
                                      <div className="text-sm font-black text-emerald-600">
                                          {Math.round(h.scores.reduce((s,i) => s + i.score, 0) / h.scores.length)}%
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="p-6 text-center text-stone-400 text-xs italic">No performance data found.</div>
                          )}
                      </div>
                  </div>

                  <div className="pt-4 pb-12">
                      <button 
                        onClick={handleMarkAttendanceFromQR}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                        <Check size={20} /> Mark Attendance Now
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-auto p-2">
         {mode === 'QR' && scanning && (
             <div className="bg-stone-900 mb-4 rounded-lg overflow-hidden relative">
                 <div id="reader" className="w-full"></div>
             </div>
         )}
         <table className="w-full text-left">
             <thead className="bg-stone-50 text-stone-600 font-medium text-sm sticky top-0">
                 <tr><th className="p-4">Status</th><th className="p-4">Name</th><th className="p-4">ID</th><th className="p-4">Class</th></tr>
             </thead>
             <tbody className="divide-y divide-stone-100">
                 {filteredStudents.map(student => {
                     const isPresent = presentIds.has(student.id);
                     return (
                         <tr key={student.id} onClick={() => toggleAttendance(student.id)} className={`cursor-pointer hover:bg-stone-50 transition-colors ${isPresent ? 'bg-emerald-50/50' : ''}`}>
                             <td className="p-4"><div className={`w-6 h-6 rounded border flex items-center justify-center ${isPresent ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>{isPresent && <Check size={16} className="text-white" />}</div></td>
                             <td className="p-4 font-medium text-stone-800">{student.name}</td>
                             <td className="p-4 text-stone-500 font-mono text-sm">{student.id}</td>
                             <td className="p-4 text-stone-600">{student.classLevel}</td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>
      </div>
      <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
        <div className="text-stone-600">Present: <span className="font-bold text-stone-900">{presentIds.size}</span> / {students.length}</div>
        <button onClick={handleSubmit} disabled={presentIds.size === 0} className={`flex items-center space-x-2 ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-6 py-2 rounded-lg disabled:opacity-50`}>
            <Save size={20} /><span>{initialData ? 'Save Changes' : 'Submit'}</span>
        </button>
      </div>
    </div>
  );
};
