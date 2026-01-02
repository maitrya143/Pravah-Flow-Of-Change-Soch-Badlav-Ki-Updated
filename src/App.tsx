
import React, { useState } from 'react';
import { ViewState, User, CityCode } from './types';
import { CITIES, CENTERS, LOGO_URL, PRIMARY_SYLLABUS } from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Admission } from './components/Admission';
import { Attendance } from './components/Attendance';
import { Diary } from './components/Diary';
import { StudentQR } from './components/StudentQR';
import { Syllabus } from './components/Syllabus'; 
import { Performance } from './components/Performance';
import { MonthlyAttendance } from './components/MonthlyAttendance';
import { DataService } from './services/dataService';
import { PDFService } from './services/pdfService';
import { ExcelService } from './services/excelService';
import { 
  Download, FileText, ArrowRight, UserPlus, AlertCircle, 
  Loader2, Edit2, Lock, Trash2, AlertTriangle, Filter, 
  MessageSquare, ArrowLeft, FileSpreadsheet, Share2 
} from 'lucide-react';

interface FloatingInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ 
  id, label, value, onChange, type = "text", required, helperText, placeholder 
}) => (
  <div className="relative mb-1">
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      className="peer block w-full appearance-none rounded-xl border border-stone-200 bg-stone-50/50 px-4 pt-5 pb-2.5 text-stone-800 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-transparent"
      placeholder={placeholder || label}
      required={required}
    />
    <label
      htmlFor={id}
      className="absolute left-4 top-3.5 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-stone-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-emerald-600 cursor-text pointer-events-none"
    >
      {label}
    </label>
    {helperText && <p className="text-xs text-stone-400 mt-1.5 ml-1">{helperText}</p>}
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');

  const [availableCenters, setAvailableCenters] = useState<{id: string, name: string}[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [tempUserName, setTempUserName] = useState('');

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const [historyVersion, setHistoryVersion] = useState(0); 
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'Admission' | 'Attendance' | 'Diary'>('ALL');
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, type: string}>({
    isOpen: false, id: '', type: ''
  });

  const extractCityCode = (id: string): CityCode | null => {
    const match = id.toUpperCase().match(/(MDA|NGP)/);
    return match ? (match[0] as CityCode) : null;
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!regId || !regName || !regPass) {
        setError("All fields are required.");
        setIsLoading(false);
        return;
      }
      const cityCode = extractCityCode(regId);
      if (!cityCode) {
        setError("Volunteer ID must contain MDA or NGP.");
        setIsLoading(false);
        return;
      }
      const result = DataService.registerUser(regId, regName, regPass);
      setIsLoading(false);
      if (result.success) {
          alert("Registration Successful!");
          setView('LOGIN');
      } else {
          setError(result.message || "Registration failed.");
      }
  };

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const authResult = DataService.authenticate(loginId, loginPass);
    if (!authResult.success) {
        setIsLoading(false);
        setError(authResult.message || "Authentication failed");
        return;
    }
    const cityCode = extractCityCode(loginId);
    if (!cityCode) {
      setIsLoading(false);
      setError("Invalid City Code.");
      return;
    }
    const centers = CENTERS.filter(c => c.cityCode === cityCode);
    setAvailableCenters(centers);
    setTempUserName(authResult.user?.name || 'Volunteer');
    setIsLoading(false);
    setView('CENTER_SELECT');
  };

  const handleCenterSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterId) return;
    const center = CENTERS.find(c => c.id === selectedCenterId);
    setUser({
      volunteerId: loginId,
      name: tempUserName, 
      centerId: selectedCenterId,
      centerName: center?.name || ''
    });
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setLoginId('');
    setLoginPass('');
    setView('LOGIN');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newName) return;
      const result = DataService.updateUser(user.volunteerId, { name: newName });
      if (result.success && result.user) {
          setUser({ ...user, name: result.user.name });
          setShowEditProfile(false);
      }
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newPass) return;
      const result = DataService.updateUser(user.volunteerId, { password: newPass });
      if (result.success) {
          setShowChangePass(false);
          setNewPass('');
      }
  };
  
  const handleFeedbackSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !feedbackSubject || !feedbackMessage) return;
      DataService.saveFeedback({
          volunteerId: user.volunteerId,
          volunteerName: user.name,
          centerId: user.centerId,
          subject: feedbackSubject,
          message: feedbackMessage
      });
      setShowFeedback(false);
  };

  const requestDelete = (id: string, type: string) => {
      setDeleteModal({ isOpen: true, id, type });
  };

  const confirmDelete = () => {
      if (deleteModal.id && deleteModal.type) {
          DataService.deleteHistoryItem(deleteModal.id, deleteModal.type);
          setHistoryVersion(prev => prev + 1); 
      }
      setDeleteModal({ isOpen: false, id: '', type: '' });
  };

  const triggerEdit = (item: any) => {
    setEditItem(item.data);
    if (item.type === 'Admission') setView('EDIT_ADMISSION');
    else if (item.type === 'Attendance') setView('EDIT_ATTENDANCE');
    else if (item.type === 'Diary') setView('EDIT_DIARY');
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100">
        <div className="flex flex-col items-center mb-8">
           {!logoError ? (
              <img src={LOGO_URL} alt="Logo" className="h-16 mb-4" onError={() => setLogoError(true)} />
           ) : (
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-emerald-800">P</span>
              </div>
           )}
           <h1 className="text-3xl font-bold text-emerald-800">PRAVAH</h1>
           <p className="text-stone-500 text-sm">Volunteer Portal</p>
        </div>
        <form onSubmit={handleLoginStep1} className="space-y-4">
          <FloatingInput id="login-id" label="Volunteer ID" value={loginId} onChange={e => setLoginId(e.target.value)} required placeholder="e.g. 25NGPWN101" />
          <FloatingInput id="login-pass" label="Password" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />} Login
          </button>
        </form>
        <p className="mt-8 text-center text-stone-500 text-sm">New volunteer? <button onClick={() => setView('REGISTER')} className="text-emerald-600 font-bold hover:underline">Register here</button></p>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Volunteer Registration</h2>
        <p className="text-stone-500 text-sm mb-6">Create your account to access center tools.</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <FloatingInput id="reg-name" label="Full Name" value={regName} onChange={e => setRegName(e.target.value)} required />
          <FloatingInput id="reg-id" label="Volunteer ID" value={regId} onChange={e => setRegId(e.target.value)} required helperText="ID must contain MDA or NGP" placeholder="e.g. 25NGPWN101" />
          <FloatingInput id="reg-pass" label="Password" type="password" value={regPass} onChange={e => setRegPass(e.target.value)} required />
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />} Register
          </button>
        </form>
        <button onClick={() => setView('LOGIN')} className="mt-6 w-full text-stone-500 text-sm flex justify-center items-center gap-1"><ArrowLeft size={16} /> Back to Login</button>
      </div>
    </div>
  );

  const renderCenterSelect = () => (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-100">
        <div className="mb-8"><h2 className="text-2xl font-bold text-stone-800">Welcome, {tempUserName}!</h2><p className="text-stone-500 text-sm">Please select your center to continue.</p></div>
        <form onSubmit={handleCenterSelect} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600 ml-1">Assigned Center</label>
                <select value={selectedCenterId} onChange={e => setSelectedCenterId(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" required>
                    <option value="">Select Center</option>
                    {availableCenters.map(center => (<option key={center.id} value={center.id}>{center.name}</option>))}
                </select>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex justify-center items-center gap-2">Enter Portal <ArrowRight size={20} /></button>
        </form>
        <button onClick={() => setView('LOGIN')} className="mt-8 w-full text-stone-400 text-xs text-center hover:text-stone-600">Switch Account</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'DASHBOARD': return <Dashboard onNavigate={setView} />;
      case 'ADMISSION': return <Admission user={user!} />;
      case 'EDIT_ADMISSION': return <Admission user={user!} initialData={editItem} />;
      case 'GENERATE_QR': return <StudentQR user={user!} />;
      case 'MANUAL_ATTENDANCE': return <Attendance mode="MANUAL" user={user!} />;
      case 'QR_SCAN': return <Attendance mode="QR" user={user!} />;
      case 'EDIT_ATTENDANCE': return <Attendance mode={editItem.mode} user={user!} initialData={editItem} />;
      case 'MONTHLY_ATTENDANCE': return <MonthlyAttendance user={user!} />;
      case 'DIARY': return <Diary user={user!} />;
      case 'EDIT_DIARY': return <Diary user={user!} initialData={editItem} />;
      case 'SYLLABUS': return <Syllabus user={user!} />;
      case 'PERFORMANCE': return <Performance user={user!} />;
      case 'HISTORY':
        const historyData = DataService.getAllHistory();
        const filteredHistory = historyFilter === 'ALL' ? historyData : historyData.filter(item => item.type === historyFilter);
        const generateHistoryDoc = async (item: any) => {
            const doc = await PDFService.createDocument(`History Record - ${item.type}`, user);
            let y = 50;
            y = PDFService.addSectionHeader(doc, 'Record Overview', y);
            PDFService.addField(doc, 'Record Type', item.type, 15, y);
            PDFService.addField(doc, 'Date', item.date, 110, y);
            y += 15;
            PDFService.addField(doc, 'Summary', item.details, 15, y, 180);
            y += 20;
            y = PDFService.addSectionHeader(doc, 'Data Dump', y);
            const dataKeys = Object.keys(item.data).filter(k => k !== 'presentStudentIds' && k !== 'volunteers');
            const tableData = dataKeys.map(key => [key, String(item.data[key])]);
            PDFService.drawTable(doc, ['Field', 'Value'], tableData, y, [15, 65]);
            PDFService.addFooter(doc);
            return doc;
        };
        return (
            <div className="space-y-6 animate-fade-in relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-stone-800">History & Corrections</h2>
                    <div className="flex bg-white p-1 rounded-lg border border-stone-200">
                        {['ALL', 'Admission', 'Attendance', 'Diary'].map(type => (
                            <button key={type} onClick={() => setHistoryFilter(type as any)} className={`px-4 py-1.5 rounded-md text-sm transition-all ${historyFilter === type ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500'}`}>{type}</button>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-4 border-b bg-stone-50 font-medium grid grid-cols-4 gap-4"><span>Date</span><span>Type</span><span>Details</span><span className="text-right">Actions</span></div>
                    <div className="divide-y divide-stone-100 max-h-[70vh] overflow-y-auto">
                        {filteredHistory.map((item, idx) => (
                            <div key={item.id + idx} className="p-4 grid grid-cols-4 gap-4 items-center hover:bg-stone-50 transition-colors">
                                <span className="text-sm text-stone-600">{item.date}</span>
                                <div className="flex flex-col"><span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${item.type === 'Admission' ? 'bg-green-100 text-green-800' : item.type === 'Attendance' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{item.type}</span>{item.updated && <span className="text-[10px] text-amber-600 font-bold uppercase mt-1">Edited</span>}</div>
                                <span className="text-sm text-stone-600 truncate">{item.details}</span>
                                <div className="flex justify-end space-x-3">
                                    <button onClick={() => triggerEdit(item)} className="text-stone-400 hover:text-amber-600" title="Edit Entry"><Edit2 size={18}/></button>
                                    <button onClick={async () => { const doc = await generateHistoryDoc(item); doc.save(`${item.type}_${item.id}.pdf`); }} className="text-stone-400 hover:text-emerald-600" title="Download PDF"><Download size={18}/></button>
                                    <button onClick={() => PDFService.shareFile(generateHistoryDoc(item) as any, `${item.type}.pdf`)} className="text-stone-400 hover:text-blue-600"><Share2 size={18}/></button>
                                    <button onClick={() => requestDelete(item.id, item.type)} className="text-stone-400 hover:text-red-500"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold mb-4">Delete Record?</h3><div className="flex space-x-3"><button onClick={() => setDeleteModal({isOpen: false, id: '', type: ''})} className="flex-1 py-2 bg-stone-100 rounded-xl">Cancel</button><button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-xl">Delete</button></div></div>
                    </div>
                )}
            </div>
        );
      case 'SETTINGS':
        return (
            <div className="max-w-xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <div className="bg-white p-6 rounded-xl border space-y-4">
                    <button onClick={() => setShowEditProfile(!showEditProfile)} className="w-full text-left py-3 border-b">Edit Profile</button>
                    {showEditProfile && (<form onSubmit={handleUpdateProfile} className="space-y-3 p-3 bg-stone-50 rounded"><input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border"/><button type="submit" className="bg-emerald-600 text-white px-4 py-1 rounded">Save</button></form>)}
                    <button onClick={() => setShowChangePass(!showChangePass)} className="w-full text-left py-3 border-b">Change Password</button>
                    <button onClick={handleLogout} className="w-full text-left py-3 text-red-600">Logout</button>
                </div>
            </div>
        );
      default: return <div>View Not Found</div>;
    }
  };

  if (view === 'LOGIN') return renderLogin();
  if (view === 'REGISTER') return renderRegister();
  if (view === 'CENTER_SELECT') return renderCenterSelect();

  return (
    <Layout user={user!} currentView={view} onNavigate={setView} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
