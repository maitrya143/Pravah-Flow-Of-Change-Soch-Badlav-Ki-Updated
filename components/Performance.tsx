
import React, { useState, useMemo, useEffect } from 'react';
import { User, Student, StudentPerformance, SubjectScore } from '../types';
import { DataService } from '../services/dataService';
import { PRIMARY_SYLLABUS } from '../constants';
import { PDFService } from '../services/pdfService';
import { 
  Search, BarChart2, Save, Download, ArrowLeft, TrendingUp, 
  Award, AlertTriangle, ChevronRight, FileText, Share2, Plus, Trash2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface PerformanceProps {
  user: User;
}

export const Performance: React.FC<PerformanceProps> = ({ user }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [manualSubjects, setManualSubjects] = useState<string[]>([]);
  const [newManualSubject, setNewManualSubject] = useState('');

  const students = DataService.getStudents().filter(s => s.centerId === user.centerId);
  
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Robust matching: Check if the student's class level string exists within the syllabus class name
  const syllabusSubjects = useMemo(() => {
    if (!selectedStudent) return [];
    const studentClass = selectedStudent.classLevel.toLowerCase().replace('class', '').trim();
    const syllabus = PRIMARY_SYLLABUS.find(p => {
        const sylClass = p.className.toLowerCase().replace('class', '').trim();
        return sylClass === studentClass || p.className.toLowerCase().includes(studentClass);
    });
    return syllabus ? syllabus.subjects.map(s => s.subject) : [];
  }, [selectedStudent]);

  // Combine syllabus subjects with any manually added ones for this entry
  const allCurrentSubjects = useMemo(() => {
    const combined = Array.from(new Set([...syllabusSubjects, ...manualSubjects]));
    return combined;
  }, [syllabusSubjects, manualSubjects]);

  const performanceHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return DataService.getPerformanceByStudent(selectedStudent.id);
  }, [selectedStudent]);

  const analytics = useMemo(() => {
    if (!selectedStudent) return null;
    return DataService.getPerformanceAnalytics(selectedStudent.id);
  }, [selectedStudent, performanceHistory]);

  const trendData = useMemo(() => {
    return performanceHistory.map(h => ({
      name: h.testName,
      avg: h.scores.reduce((sum, s) => sum + s.score, 0) / h.scores.length
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [performanceHistory]);

  const handleScoreChange = (subj: string, val: string) => {
    const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val) || 0));
    setScores(prev => ({ ...prev, [subj]: num }));
  };

  const calculateGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const addManualSubject = () => {
    if (!newManualSubject.trim() || allCurrentSubjects.includes(newManualSubject.trim())) return;
    setManualSubjects(prev => [...prev, newManualSubject.trim()]);
    setNewManualSubject('');
  };

  const removeManualSubject = (subj: string) => {
    setManualSubjects(prev => prev.filter(s => s !== subj));
    const newScores = { ...scores };
    delete newScores[subj];
    setScores(newScores);
  };

  const handleSavePerformance = () => {
    if (!selectedStudent || !testName.trim()) {
        alert("Please enter a Test Name.");
        return;
    }

    if (allCurrentSubjects.length === 0) {
        alert("Please add at least one subject.");
        return;
    }

    const finalScores: SubjectScore[] = allCurrentSubjects.map(subj => ({
      subject: subj,
      score: scores[subj] || 0,
      grade: calculateGrade(scores[subj] || 0),
      remarks: remarks[subj] || ''
    }));

    const newPerf: StudentPerformance = {
      id: Date.now().toString(),
      studentId: selectedStudent.id,
      testName,
      date: testDate,
      scores: finalScores
    };

    DataService.savePerformance(newPerf);
    setTestName('');
    setScores({});
    setRemarks({});
    setManualSubjects([]);
    alert("Performance record saved successfully!");
  };

  const handleDownloadReport = async (record: StudentPerformance) => {
    if (!selectedStudent) return;
    const doc = await PDFService.generatePerformancePDF(selectedStudent, record, analytics, user);
    doc.save(`Performance_${selectedStudent.id}_${record.testName}.pdf`);
  };

  if (selectedStudent) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center justify-between">
            <button onClick={() => setSelectedStudent(null)} className="flex items-center text-stone-500 hover:text-emerald-600 transition-colors">
                <ArrowLeft size={20} className="mr-1" /> Back to Student List
            </button>
            <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">{selectedStudent.id}</span>
                <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">{selectedStudent.classLevel}</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-800">{selectedStudent.name}</h2>
            <p className="text-stone-500">Center: {user.centerName}</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                      <Award className="text-emerald-600" size={20} />
                      <span className="text-xs font-bold text-emerald-700 uppercase">Average</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">{Math.round(analytics.average)}%</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="text-blue-600" size={20} />
                      <span className="text-xs font-bold text-blue-700 uppercase">Strongest</span>
                  </div>
                  <div className="text-sm font-bold text-blue-900 truncate">{analytics.strongest?.subject || 'N/A'}</div>
                  <div className="text-xs text-blue-600">{analytics.strongest ? Math.round(analytics.strongest.avg) + '% Avg' : ''}</div>
              </div>
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                      <BarChart2 className="text-stone-600" size={20} />
                      <span className="text-xs font-bold text-stone-700 uppercase">Weakest</span>
                  </div>
                  <div className="text-sm font-bold text-stone-900 truncate">{analytics.weakest?.subject || 'N/A'}</div>
                  <div className="text-xs text-stone-600">{analytics.weakest ? Math.round(analytics.weakest.avg) + '% Avg' : ''}</div>
              </div>
              {analytics.needsAttention && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col justify-center animate-pulse">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <AlertTriangle size={20} />
                        <span className="text-xs font-bold uppercase">Attention Needed</span>
                    </div>
                    <p className="text-[10px] text-red-700 leading-tight font-semibold">⚠️ Academic Attention Required</p>
                </div>
              )}
          </div>
        )}

        {/* Entry Form */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="bg-stone-50 p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-stone-800">New Performance Entry</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <input 
                        type="text" 
                        placeholder="Test Name (e.g. Unit Test 1)" 
                        value={testName} 
                        onChange={e => setTestName(e.target.value)} 
                        className="text-sm p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    />
                    <input 
                        type="date" 
                        value={testDate} 
                        onChange={e => setTestDate(e.target.value)} 
                        className="text-sm p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-stone-100 text-stone-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold">Subject</th>
                            <th className="p-4 font-semibold">Score (0-100)</th>
                            <th className="p-4 font-semibold">Grade</th>
                            <th className="p-4 font-semibold">Remarks</th>
                            <th className="p-4 font-semibold text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {allCurrentSubjects.length > 0 ? (
                            allCurrentSubjects.map(subj => (
                                <tr key={subj} className="hover:bg-stone-50 group">
                                    <td className="p-4 font-medium text-stone-800">{subj}</td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            min="0" max="100" 
                                            value={scores[subj] === undefined ? '' : scores[subj]} 
                                            onChange={e => handleScoreChange(subj, e.target.value)}
                                            placeholder="Score"
                                            className={`w-24 p-2 border rounded focus:ring-emerald-500 outline-none ${ (scores[subj] || 0) < 40 && scores[subj] !== undefined ? 'border-red-300 bg-red-50 text-red-700' : 'border-stone-200' }`}
                                        />
                                        { (scores[subj] || 0) < 40 && scores[subj] !== undefined && <span className="text-[10px] text-red-600 block mt-1 font-bold">Needs Support</span> }
                                    </td>
                                    <td className="p-4"><span className={`font-bold ${ (scores[subj] || 0) < 40 ? 'text-red-600' : 'text-stone-600' }`}>{calculateGrade(scores[subj] || 0)}</span></td>
                                    <td className="p-4">
                                        <input 
                                            type="text" 
                                            placeholder="Remarks..." 
                                            value={remarks[subj] || ''} 
                                            onChange={e => setRemarks(prev => ({ ...prev, [subj]: e.target.value }))} 
                                            className="w-full p-2 border border-transparent focus:border-stone-200 bg-stone-50/50 rounded transition-all" 
                                        />
                                    </td>
                                    <td className="p-4 text-right">
                                        {manualSubjects.includes(subj) && (
                                            <button onClick={() => removeManualSubject(subj)} className="text-stone-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-stone-400 italic bg-stone-50">
                                    No subjects found for {selectedStudent.classLevel}. Add subjects manually below.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manual Add Subject Footer */}
            <div className="p-4 bg-stone-50/50 border-t flex flex-wrap items-center gap-3">
                <input 
                    type="text" 
                    placeholder="Add manual subject..." 
                    value={newManualSubject} 
                    onChange={e => setNewManualSubject(e.target.value)}
                    className="p-2 border border-stone-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addManualSubject()}
                />
                <button 
                    onClick={addManualSubject}
                    className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 p-2"
                >
                    <Plus size={16} /> Add Subject
                </button>
            </div>

            <div className="p-6 bg-stone-50 border-t flex justify-end">
                <button 
                    onClick={handleSavePerformance} 
                    disabled={!testName.trim() || allCurrentSubjects.length === 0} 
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:bg-stone-300 shadow-lg transition-all"
                >
                    <Save size={20} /><span>Save Result</span>
                </button>
            </div>
        </div>

        {/* Visual Trend */}
        {trendData.length > 1 && (
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" size={20} />
                    Academic Growth Trend
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} />
                            <YAxis stroke="#a8a29e" fontSize={11} domain={[0, 100]} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="avg" stroke="#059669" strokeWidth={4} dot={{ fill: '#059669', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Previous Results Card */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="bg-stone-50 p-4 border-b flex items-center gap-2">
                <History className="text-stone-500" size={18} />
                <h3 className="font-bold text-stone-800">Test History</h3>
            </div>
            <div className="divide-y divide-stone-100">
                {performanceHistory.length > 0 ? (
                    performanceHistory.map(h => (
                        <div key={h.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700"><FileText size={20} /></div>
                                <div>
                                    <div className="font-bold text-stone-800">{h.testName}</div>
                                    <div className="text-xs text-stone-500 flex items-center gap-2">
                                        <span>{h.date}</span>
                                        <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                        <span className="font-bold text-emerald-600">Avg: {Math.round(h.scores.reduce((s,i) => s + i.score, 0) / h.scores.length)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownloadReport(h)} className="p-2 text-stone-400 hover:text-emerald-600 transition-colors" title="Download Report"><Download size={20} /></button>
                                <button onClick={async () => {
                                    const doc = await PDFService.generatePerformancePDF(selectedStudent, h, analytics, user);
                                    await PDFService.shareFile(doc, `Performance_${h.testName}.pdf`);
                                }} className="p-2 text-stone-400 hover:text-blue-600 transition-colors" title="Share"><Share2 size={20} /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center text-stone-400">
                        <BarChart2 size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No academic records found for this student.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-stone-800">Student Performance</h2>
                <p className="text-stone-500 text-sm">Track academic progress, test results, and provide needed support.</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="relative mb-8">
                <Search className="absolute left-4 top-4 text-stone-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search students to log performance..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50/50 transition-all outline-none"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <button 
                            key={student.id} 
                            onClick={() => setSelectedStudent(student)}
                            className="p-5 border border-stone-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">{student.id}</span>
                                <span className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500 uppercase">{student.classLevel}</span>
                            </div>
                            <div className="font-bold text-stone-800 group-hover:text-emerald-800 text-lg mb-1">{student.name}</div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold">Guardian</span>
                                    <span className="text-xs text-stone-600 font-medium">{student.parentName}</span>
                                </div>
                                <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-stone-400">
                        <Search size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No students match your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// Internal History Icon for the component
const History = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} height={size || 24} 
        viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" strokeWidth="2" 
        strokeLinecap="round" strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);
