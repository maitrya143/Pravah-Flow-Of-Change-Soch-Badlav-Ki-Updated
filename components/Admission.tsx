
import React, { useState, useEffect } from 'react';
import { Student, User } from '../types';
import { DataService } from '../services/dataService';
import { PDFService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';
import { Download, CheckCircle, ArrowLeft, Upload, FileText, FileSpreadsheet, Share2, Edit3 } from 'lucide-react';

interface AdmissionProps {
    user: User;
    initialData?: Student | null;
}

export const Admission: React.FC<AdmissionProps> = ({ user, initialData }) => {
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [fileName, setFileName] = useState(initialData?.admissionFormFile || '');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    gender: initialData?.gender || 'Male',
    dob: initialData?.dob || '',
    age: initialData?.age?.toString() || '',
    classLevel: initialData?.classLevel || '',
    schoolName: initialData?.schoolName || '',
    parentName: initialData?.parentName || '',
    parentOccupation: initialData?.parentOccupation || '',
    aadhaar: initialData?.aadhaar || '',
    contact: initialData?.contact || '',
    registrationNumber: initialData?.registrationNumber || '',
    admissionFormFile: initialData?.admissionFormFile || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setFileName(file.name);
          setFormData({ ...formData, admissionFormFile: file.name });
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentToSave = {
      ...formData,
      id: initialData?.id, // Preserve ID if editing
      age: parseInt(formData.age) || 0,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      admissionDate: initialData?.admissionDate || new Date().toISOString().split('T')[0],
    };
    
    const newStudent = DataService.addStudent(studentToSave as any, user);
    setCreatedStudent(newStudent);
    setStep('SUCCESS');
  };

  const generatePDF = async () => {
    if (!createdStudent) return null;
    const doc = await PDFService.createDocument(initialData ? 'Updated Admission' : 'Admission Form', user);
    let y = 50;

    y = PDFService.addSectionHeader(doc, 'Student Information', y);
    PDFService.addField(doc, 'Student ID', createdStudent.id, 15, y);
    PDFService.addField(doc, 'Registration No.', createdStudent.registrationNumber || '-', 110, y);
    y += 15;

    PDFService.addField(doc, 'Full Name', createdStudent.name, 15, y);
    PDFService.addField(doc, 'Gender', createdStudent.gender, 110, y);
    y += 15;

    PDFService.addField(doc, 'Date of Birth', createdStudent.dob, 15, y);
    PDFService.addField(doc, 'Age', createdStudent.age.toString(), 60, y);
    PDFService.addField(doc, 'Class', createdStudent.classLevel, 110, y);
    y += 15;

    PDFService.addField(doc, 'School Name', createdStudent.schoolName, 15, y, 180);
    y += 20;

    y = PDFService.addSectionHeader(doc, 'Guardian Information', y);
    PDFService.addField(doc, 'Father/Guardian Name', createdStudent.parentName, 15, y);
    PDFService.addField(doc, 'Occupation', createdStudent.parentOccupation || '-', 110, y);
    y += 15;

    PDFService.addField(doc, 'Contact Number', createdStudent.contact, 15, y);
    PDFService.addField(doc, 'Aadhaar Number', createdStudent.aadhaar || '-', 110, y);
    y += 25;

    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.roundedRect(65, y, 80, 90, 2, 2, 'S');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT IDENTITY QR", 105, y + 10, { align: 'center' });
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${createdStudent.id}`;
    try {
        doc.addImage(qrUrl, 'JPEG', 80, y + 15, 50, 50);
    } catch (e) {}

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Scan this code for daily attendance", 105, y + 75, { align: 'center' });
    doc.text(`ID: ${createdStudent.id}`, 105, y + 82, { align: 'center' });

    PDFService.addFooter(doc);
    return doc;
  };

  const handleDownload = async () => {
    const doc = await generatePDF();
    if(doc && createdStudent) {
        doc.save(`PRAVAH_Admission_${createdStudent.id}.pdf`);
    }
  };

  const handleShare = async () => {
    const doc = await generatePDF();
    if(doc && createdStudent) {
        await PDFService.shareFile(doc, `PRAVAH_Admission_${createdStudent.id}.pdf`);
    }
  };

  const handleExcelDownload = () => {
    if (!createdStudent) return;
    ExcelService.generateAdmissionExcel(createdStudent, user);
  };

  const resetForm = () => {
    setFormData({
      name: '', gender: 'Male', dob: '', age: '', classLevel: '', 
      schoolName: '', parentName: '', parentOccupation: '', 
      aadhaar: '', contact: '', registrationNumber: '', admissionFormFile: ''
    });
    setFileName('');
    setStep('FORM');
  };

  if (step === 'SUCCESS' && createdStudent) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${createdStudent.id}`;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-800">{initialData ? 'Record Updated!' : 'Admission Successful!'}</h2>
          <p className="text-stone-500 mt-2">Student ID: <span className="font-mono font-bold text-stone-900">{createdStudent.id}</span></p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200">
            <div className="flex justify-center mb-4">
               <img src={qrUrl} alt="Student QR Code" className="w-48 h-48 border-4 border-white shadow-sm" />
            </div>
            <p className="text-sm font-medium text-stone-600">Scan to mark attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button onClick={handleDownload} className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"><Download size={20} /><span>PDF Form</span></button>
            <button onClick={handleShare} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"><Share2 size={20} /><span>Share</span></button>
            {!initialData && (
              <button onClick={resetForm} className="flex items-center justify-center space-x-2 bg-stone-100 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-200 transition-colors">
                  <ArrowLeft size={20} /><span>New Admission</span>
              </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className={`${initialData ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} px-8 py-6 border-b`}>
        <div className="flex items-center space-x-2">
            {initialData && <Edit3 className="text-amber-600" size={20} />}
            <h2 className="text-xl font-bold text-stone-800">{initialData ? 'Correction: Student Details' : 'New Admission Form'}</h2>
        </div>
        <p className="text-sm text-stone-600">{initialData ? `Updating record for ${initialData.id}` : 'Enter student details accurately.'}</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-100">Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Date of Birth</label>
                <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Age</label>
                <input required type="number" name="age" value={formData.age} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Class</label>
                <input required type="text" name="classLevel" value={formData.classLevel} onChange={handleChange} placeholder="e.g. 5th" className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">School Name</label>
                <input required type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4 pb-2 border-b border-stone-100">Guardian Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Father/Guardian Name</label>
                <input required type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Occupation</label>
                <input required type="text" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Aadhaar Number</label>
                <input required type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Number</label>
                <input required type="tel" name="contact" value={formData.contact} onChange={handleChange} className="w-full rounded-lg border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
            </div>
          </div>
        </div>
        <div className="pt-6">
            <button type="submit" className={`w-full ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white py-3 rounded-lg font-semibold transition-colors shadow-sm`}>
                {initialData ? 'Update Record' : 'Register Student'}
            </button>
        </div>
      </form>
    </div>
  );
};
