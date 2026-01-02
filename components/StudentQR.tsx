
import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { PDFService, loadImage } from '../services/pdfService';
import { LOGO_URL } from '../constants';
import { Student, User } from '../types';
import { Search, Download, ArrowLeft, CreditCard, User as UserIcon, PenTool, Database, Save, CheckCircle, Share2 } from 'lucide-react';

interface StudentQRProps {
  user: User;
}

export const StudentQR: React.FC<StudentQRProps> = ({ user }) => {
  const [mode, setMode] = useState<'SEARCH' | 'MANUAL'>('SEARCH');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [manualData, setManualData] = useState({
      name: '', id: '', classLevel: '', gender: 'Male', parentName: '', contact: ''
  });

  const allStudents = DataService.getStudents();
  
  const filteredStudents = allStudents.filter(s => 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
     s.centerId === user.centerId
  );

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const savedStudent = DataService.addStudent({
          id: manualData.id.trim(),
          name: manualData.name,
          gender: manualData.gender as any,
          classLevel: manualData.classLevel || '-',
          parentName: manualData.parentName || '-',
          contact: manualData.contact || '-',
      } as any, user);
      alert(`Student ${savedStudent.name} saved/updated in database!`);
      setSelectedStudent(savedStudent);
  };

  const generatePDF = async (student: Student) => {
    // We create a document but we won't use the standard full page header for the ID card to keep it card-sized.
    // However, to keep it A4 printable, we will draw the card centered on an A4 page with the branding.
    const doc = await PDFService.createDocument('Student Identity Card', user);
    
    const cardX = 55;
    const cardY = 60;
    const cardW = 100;
    const cardH = 140;

    // Card Border
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, 'FD');

    // Inner Green Header
    doc.setFillColor(5, 150, 105); // Emerald 600
    doc.roundedRect(cardX, cardY, cardW, 25, 3, 3, 'F');
    // Fix top corners rounding clipping by rect filling lower part
    doc.rect(cardX, cardY + 20, cardW, 5, 'F'); 

    // Logo & Text in Card Header
    try {
        const img = await loadImage(LOGO_URL);
        if (img.src) doc.addImage(img, 'PNG', cardX + 5, cardY + 4, 16, 16);
    } catch(e) {}

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PRAVAH", cardX + 25, cardY + 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("The Flow of Change", cardX + 25, cardY + 19);

    // Student Photo Placeholder / Icon
    doc.setFillColor(245, 245, 244);
    doc.circle(cardX + 50, cardY + 40, 12, 'F');
    // We can't draw the lucide icon easily, so we leave circle or add simple text
    doc.setTextColor(150);
    doc.setFontSize(20);
    doc.text(student.name.charAt(0), cardX + 50, cardY + 42, { align: 'center' });

    // Info
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(student.name, cardX + 50, cardY + 60, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: ${student.id}`, cardX + 50, cardY + 66, { align: 'center' });
    doc.text(`Class: ${student.classLevel} | Gender: ${student.gender}`, cardX + 50, cardY + 72, { align: 'center' });
    doc.text(`Center: ${user.centerName}`, cardX + 50, cardY + 78, { align: 'center' });

    // QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.id}`;
    try {
        doc.addImage(qrUrl, 'JPEG', cardX + 25, cardY + 85, 50, 50);
    } catch(e) {}

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Scan for Attendance", cardX + 50, cardY + 138, { align: 'center' });

    PDFService.addFooter(doc);
    return doc;
  };

  const handleDownload = async (student: Student) => {
      const doc = await generatePDF(student);
      doc.save(`ID_${student.id}.pdf`);
  };

  const handleShare = async (student: Student) => {
      const doc = await generatePDF(student);
      await PDFService.shareFile(doc, `ID_${student.id}.pdf`);
  };

  if (selectedStudent) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedStudent.id}`;
    
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <button 
          onClick={() => setSelectedStudent(null)}
          className="flex items-center text-stone-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" /> Back to {mode === 'SEARCH' ? 'Search' : 'Manual Entry'}
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm mb-3">
                    <UserIcon size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">{selectedStudent.name}</h2>
                <p className="text-emerald-700 font-mono font-medium">{selectedStudent.id}</p>
                {mode === 'MANUAL' && (
                    <div className="mt-2 flex items-center justify-center space-x-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-semibold mx-auto w-fit">
                        <CheckCircle size={12} />
                        <span>Saved to Database</span>
                    </div>
                )}
            </div>
            
            <div className="p-8 flex flex-col items-center space-y-6">
                <div className="p-2 border-2 border-stone-100 rounded-lg">
                    <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                
                <div className="text-center space-y-1">
                    <p className="text-stone-600"><span className="font-semibold">Class:</span> {selectedStudent.classLevel}</p>
                    <p className="text-stone-600"><span className="font-semibold">Guardian:</span> {selectedStudent.parentName}</p>
                </div>

                <div className="flex flex-col w-full space-y-3">
                    <button 
                        onClick={() => handleDownload(selectedStudent)}
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download size={20} />
                        <span>Download ID Card</span>
                    </button>
                    <button 
                        onClick={() => handleShare(selectedStudent)}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Share2 size={20} />
                        <span>Share ID Card</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-stone-800">Student QR Codes</h2>
                <p className="text-stone-500 text-sm">Generate QR codes for existing students or manually create one.</p>
            </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl w-full max-w-md">
            <button 
                onClick={() => setMode('SEARCH')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'SEARCH' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Database size={16} />
                <span>Search Database</span>
            </button>
            <button 
                onClick={() => setMode('MANUAL')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'MANUAL' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <PenTool size={16} />
                <span>Manual Entry</span>
            </button>
        </div>

        {mode === 'SEARCH' ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-3.5 text-stone-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by Student Name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 transition-all"
                    />
                </div>

                <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-stone-100 text-stone-500 text-sm">
                                <th className="py-3 font-medium">Student Name</th>
                                <th className="py-3 font-medium">ID</th>
                                <th className="py-3 font-medium">Class</th>
                                <th className="py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="group hover:bg-emerald-50/30 transition-colors">
                                        <td className="py-4 text-stone-800 font-medium">{student.name}</td>
                                        <td className="py-4 text-stone-500 font-mono text-sm">{student.id}</td>
                                        <td className="py-4 text-stone-600">{student.classLevel}</td>
                                        <td className="py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedStudent(student)}
                                                className="inline-flex items-center space-x-1.5 text-sm bg-stone-100 hover:bg-emerald-600 hover:text-white text-stone-700 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <CreditCard size={16} />
                                                <span>Generate QR</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-stone-400">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 max-w-2xl">
                 <h3 className="text-lg font-bold text-stone-800 mb-4">Manual QR Generator & Save</h3>
                 <p className="text-stone-500 mb-6 text-sm">Create a quick ID card. <strong>Note:</strong> This will also save/update the student in the Attendance database.</p>
                 
                 <form onSubmit={handleManualSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-stone-700 mb-1">Student ID *</label>
                             <input 
                                required
                                type="text" 
                                value={manualData.id} 
                                onChange={e => setManualData({...manualData, id: e.target.value.toUpperCase()})}
                                placeholder="e.g. 25NGPWN101"
                                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-stone-700 mb-1">Full Name *</label>
                             <input 
                                required
                                type="text" 
                                value={manualData.name} 
                                onChange={e => setManualData({...manualData, name: e.target.value})}
                                placeholder="Student Name"
                                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-stone-700 mb-1">Class</label>
                             <input 
                                type="text" 
                                value={manualData.classLevel} 
                                onChange={e => setManualData({...manualData, classLevel: e.target.value})}
                                placeholder="e.g. 5th"
                                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
                             <select 
                                value={manualData.gender} 
                                onChange={e => setManualData({...manualData, gender: e.target.value})}
                                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                             >
                                 <option value="Male">Male</option>
                                 <option value="Female">Female</option>
                                 <option value="Other">Other</option>
                             </select>
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-stone-700 mb-1">Guardian Name (Optional)</label>
                             <input 
                                type="text" 
                                value={manualData.parentName} 
                                onChange={e => setManualData({...manualData, parentName: e.target.value})}
                                placeholder="Parent/Guardian Name"
                                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                             />
                         </div>
                     </div>
                     
                     <div className="pt-4">
                         <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex justify-center items-center space-x-2">
                             <Save size={20} />
                             <span>Save & Generate QR</span>
                         </button>
                     </div>
                 </form>
            </div>
        )}
    </div>
  );
};
