
import React, { useState, useEffect } from 'react';
import { User, SyllabusProgress } from '../types';
import { PRIMARY_SYLLABUS } from '../constants';
import { DataService } from '../services/dataService';
import { Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SyllabusProps {
  user: User;
}

const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

export const Syllabus: React.FC<SyllabusProps> = ({ user }) => {
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  // Store progress as key: "ClassName-Subject" -> percentage
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({ 'Class 1st': true });
  const [isSaved, setIsSaved] = useState(false);

  // Load progress when week or center changes
  useEffect(() => {
    const data = DataService.getSyllabusProgress(user.centerId, selectedWeek);
    const newMap: Record<string, number> = {};
    
    data.forEach(item => {
      const key = `${item.className}-${item.subject}`;
      newMap[key] = item.percentage;
    });

    setProgressMap(newMap);
    setIsSaved(false);
  }, [user.centerId, selectedWeek]);

  const toggleClass = (className: string) => {
    setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }));
  };

  const handleSliderChange = (className: string, subject: string, value: string) => {
    const key = `${className}-${subject}`;
    setProgressMap(prev => ({
      ...prev,
      [key]: parseInt(value)
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const progressList: SyllabusProgress[] = [];

    PRIMARY_SYLLABUS.forEach(cls => {
      cls.subjects.forEach(subj => {
        const key = `${cls.className}-${subj.subject}`;
        if (progressMap[key] !== undefined) {
          progressList.push({
            id: `${user.centerId}-${selectedWeek}-${key}`,
            centerId: user.centerId,
            week: selectedWeek,
            className: cls.className,
            subject: subj.subject,
            percentage: progressMap[key],
            lastUpdated: new Date().toISOString()
          });
        }
      });
    });

    DataService.saveSyllabusProgress(progressList);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Hide success message after 2s
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Syllabus Tracker</h2>
          <p className="text-stone-500 text-sm">Primary Class Syllabus (Oct–Dec 2025–26)</p>
        </div>
        
        {/* Week Selector */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
          {WEEKS.map(week => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedWeek === week
                  ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              {week}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {PRIMARY_SYLLABUS.map((classData, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <button 
              onClick={() => toggleClass(classData.className)}
              className="w-full flex items-center justify-between bg-stone-50 px-6 py-4 border-b border-stone-100 hover:bg-stone-100 transition-colors"
            >
              <h3 className="font-bold text-stone-800 text-lg">{classData.className}</h3>
              {expandedClasses[classData.className] ? <ChevronUp size={20} className="text-stone-500"/> : <ChevronDown size={20} className="text-stone-500"/>}
            </button>
            
            {expandedClasses[classData.className] && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {classData.subjects.map((subj, sIdx) => {
                  const key = `${classData.className}-${subj.subject}`;
                  const currentVal = progressMap[key] || 0;

                  return (
                    <div key={sIdx} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-stone-700">{subj.subject}</h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          currentVal === 100 ? 'bg-green-100 text-green-700' :
                          currentVal > 0 ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {currentVal}% Completed
                        </span>
                      </div>
                      
                      {/* Topics List */}
                      <ul className="list-disc list-inside space-y-1 mb-2">
                        {subj.topics.map((topic, tIdx) => (
                          <li key={tIdx} className="text-xs text-stone-500 pl-1">{topic}</li>
                        ))}
                      </ul>

                      {/* Slider */}
                      <div className="flex items-center space-x-3">
                         <span className="text-xs font-medium text-stone-400">0%</span>
                         <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            value={currentVal}
                            onChange={(e) => handleSliderChange(classData.className, subj.subject, e.target.value)}
                            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                         />
                         <span className="text-xs font-medium text-stone-400">100%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-6 lg:right-10 flex flex-col items-end space-y-2 z-30">
        {isSaved && (
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
            <CheckCircle size={18} />
            <span className="font-medium text-sm">Progress Saved!</span>
          </div>
        )}
        <button 
          onClick={handleSave}
          className="bg-stone-800 text-white px-6 py-4 rounded-full shadow-xl hover:bg-stone-900 transition-transform hover:scale-105 flex items-center space-x-2 font-bold"
        >
          <Save size={20} />
          <span>Save {selectedWeek} Progress</span>
        </button>
      </div>
    </div>
  );
};
