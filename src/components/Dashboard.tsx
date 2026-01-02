import React from 'react';
import { ViewState } from '../types';
import { 
  UserPlus, QrCode, BookOpen, FileText, Activity, ClipboardCheck, History 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { DataService } from '../services/dataService';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

const QuickAction = ({ 
  icon: Icon, 
  label, 
  colorClass, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  colorClass: string, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col items-center justify-center space-y-3 hover:shadow-md transition-shadow group"
  >
    <div className={`p-4 rounded-full ${colorClass} group-hover:scale-110 transition-transform`}>
      <Icon size={24} className="text-white" />
    </div>
    <span className="font-semibold text-stone-700">{label}</span>
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const data = DataService.getPerformanceStats();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Dashboard</h2>
          <p className="text-stone-500">Welcome back! Here's your center's overview.</p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <QuickAction 
          icon={ClipboardCheck} 
          label="Attendance" 
          colorClass="bg-blue-500" 
          onClick={() => onNavigate('MANUAL_ATTENDANCE')} 
        />
        <QuickAction 
          icon={QrCode} 
          label="QR Scan" 
          colorClass="bg-purple-500" 
          onClick={() => onNavigate('QR_SCAN')} 
        />
        <QuickAction 
          icon={BookOpen} 
          label="UPAY Diary" 
          colorClass="bg-orange-500" 
          onClick={() => onNavigate('DIARY')} 
        />
        <QuickAction 
          icon={UserPlus} 
          label="Admission" 
          colorClass="bg-emerald-500" 
          onClick={() => onNavigate('ADMISSION')} 
        />
        <QuickAction 
          icon={History} 
          label="History" 
          colorClass="bg-stone-500" 
          onClick={() => onNavigate('HISTORY')} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-800 flex items-center">
              <Activity className="mr-2 text-emerald-600" size={20} />
              Performance & Attendance
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={12} />
                <YAxis stroke="#78716c" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e7e5e4' }}
                />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#059669" name="Attendance %" strokeWidth={2} />
                <Line type="monotone" dataKey="completion" stroke="#ea580c" name="Syllabus %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-800 flex items-center">
              <FileText className="mr-2 text-blue-600" size={20} />
              Syllabus Progress
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={12} />
                <YAxis stroke="#78716c" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e7e5e4' }}
                />
                <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completion" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};