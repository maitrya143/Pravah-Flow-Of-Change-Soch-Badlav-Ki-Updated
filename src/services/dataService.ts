
import { Student, DiaryEntry, AttendanceRecord, User, Center, Feedback, SyllabusProgress, MonthlyReportData, StudentPerformance } from '../types';
import { CENTERS } from '../constants';

const getStorage = <T>(key: string, initial: T): T => {
  try {
    const saved = localStorage.getItem(`pravah_${key}`);
    return saved ? JSON.parse(saved) : (Array.isArray(initial) ? [...initial] as unknown as T : initial);
  } catch (e) {
    console.error('Storage access error', e);
    return initial;
  }
};

const setStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(`pravah_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
};

const DEFAULT_STUDENTS: Student[] = [];
const DEFAULT_USERS = [
    { volunteerId: '25MDA177', name: 'Preet Patil', password: 'password' }
];

let students: Student[] = getStorage('students', DEFAULT_STUDENTS);
let diaries: DiaryEntry[] = getStorage('diaries', []);
let attendanceHistory: AttendanceRecord[] = getStorage('attendance', []);
let users: any[] = getStorage('users', DEFAULT_USERS);
let feedbacks: Feedback[] = getStorage('feedbacks', []);
let syllabusProgress: SyllabusProgress[] = getStorage('syllabus_progress', []);
let performanceData: StudentPerformance[] = getStorage('performance', []);

export const DataService = {
  getStudents: () => [...students],
  
  addStudent: (student: Omit<Student, 'id' | 'centerId'> & { id?: string }, user: User) => {
    let newId = student.id;
    
    if (!newId) {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const center = CENTERS.find(c => c.id === user.centerId);
        const cityCode = center?.cityCode || 'XX';
        const shortCode = center?.shortCode || 'XX';
        const randomNum = Math.floor(100 + Math.random() * 900);
        newId = `${currentYear}${cityCode}${shortCode}${randomNum}`;
    } else {
        newId = newId.trim().toUpperCase();
    }

    const newStudent: Student = {
      ...student,
      id: newId,
      centerId: user.centerId,
      dob: student.dob || '-',
      age: student.age || 0,
      schoolName: student.schoolName || '-',
      parentOccupation: student.parentOccupation || '-',
      aadhaar: student.aadhaar || '-',
      registrationNumber: student.registrationNumber || '-',
      admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
      admissionFormFile: student.admissionFormFile
    };
    
    const existingIndex = students.findIndex(s => s.id === newId);
    
    if (existingIndex >= 0) {
        students[existingIndex] = { 
          ...students[existingIndex], 
          ...newStudent,
          updated: true,
          lastUpdated: new Date().toISOString()
        };
    } else {
        students.push(newStudent);
    }

    setStorage('students', students);
    return newStudent;
  },

  saveDiary: (entry: DiaryEntry) => {
    const existingIndex = diaries.findIndex(d => d.id === entry.id);
    if (existingIndex >= 0) {
      diaries[existingIndex] = { 
        ...entry, 
        updated: true, 
        lastUpdated: new Date().toISOString() 
      };
    } else {
      diaries.push(entry);
    }
    setStorage('diaries', diaries);
    return entry;
  },

  getDiaries: () => [...diaries],

  saveAttendance: (record: Omit<AttendanceRecord, 'id'> & { id?: string }) => {
    const isUpdate = !!record.id;
    const finalId = record.id || `ATT-${Date.now()}`;
    const newRecord: AttendanceRecord = {
        ...record,
        id: finalId,
        updated: isUpdate ? true : undefined,
        lastUpdated: isUpdate ? new Date().toISOString() : undefined
    } as AttendanceRecord;

    if (isUpdate) {
      const idx = attendanceHistory.findIndex(a => a.id === finalId);
      if (idx >= 0) attendanceHistory[idx] = newRecord;
    } else {
      attendanceHistory.push(newRecord);
    }

    setStorage('attendance', attendanceHistory);
    return newRecord;
  },

  getAttendanceHistory: () => [...attendanceHistory],
  
  // Performance Methods
  getPerformanceByStudent: (studentId: string) => performanceData.filter(p => p.studentId === studentId),
  
  savePerformance: (perf: StudentPerformance) => {
    const existingIndex = performanceData.findIndex(p => p.id === perf.id);
    if (existingIndex >= 0) {
      performanceData[existingIndex] = perf;
    } else {
      performanceData.push(perf);
    }
    setStorage('performance', performanceData);
    return perf;
  },

  getPerformanceAnalytics: (studentId: string) => {
    const records = performanceData.filter(p => p.studentId === studentId);
    if (records.length === 0) return null;

    const allScores = records.flatMap(r => r.scores);
    const avgScore = allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length;
    
    const subjectSums: Record<string, { total: number, count: number }> = {};
    allScores.forEach(s => {
      if (!subjectSums[s.subject]) subjectSums[s.subject] = { total: 0, count: 0 };
      subjectSums[s.subject].total += s.score;
      subjectSums[s.subject].count += 1;
    });

    const subjectAvgs = Object.entries(subjectSums).map(([subj, data]) => ({
      subject: subj,
      avg: data.total / data.count
    }));

    const strongest = [...subjectAvgs].sort((a,b) => b.avg - a.avg)[0];
    const weakest = [...subjectAvgs].sort((a,b) => a.avg - b.avg)[0];

    // Low mark alert logic
    const lowMarkTests = records.filter(r => r.scores.some(s => s.score < 40)).length;
    const needsAttention = lowMarkTests >= 3;

    return {
      average: avgScore,
      strongest,
      weakest,
      needsAttention,
      lowMarkAlert: allScores.some(s => s.score < 40)
    };
  },

  getMonthlyReport: (centerId: string, month: number, year: number, className: string): MonthlyReportData => {
      const classStudents = students.filter(s => 
          s.centerId === centerId && 
          (className === 'All' || s.classLevel === className)
      );

      const monthRecords = attendanceHistory.filter(r => {
          const d = new Date(r.date);
          return d.getMonth() === month && d.getFullYear() === year;
      });

      const workingDays = monthRecords.length;

      const studentStats = classStudents.map(student => {
          const presentCount = monthRecords.filter(r => r.presentStudentIds.includes(student.id)).length;
          return {
              studentId: student.id,
              name: student.name,
              presentDays: presentCount,
              percentage: workingDays > 0 ? (presentCount / workingDays) * 100 : 0
          };
      });

      const totalPresentPercentage = studentStats.reduce((sum, s) => sum + s.percentage, 0);
      const averageAttendance = classStudents.length > 0 ? totalPresentPercentage / classStudents.length : 0;

      return {
          month: new Date(year, month).toLocaleString('default', { month: 'long' }),
          year,
          className,
          workingDays,
          averageAttendance,
          totalStudents: classStudents.length,
          studentStats: studentStats.sort((a,b) => b.percentage - a.percentage)
      };
  },
  
  getAllHistory: () => {
    const admissionRecords = students.map(s => ({
        id: s.id,
        type: 'Admission',
        date: s.admissionDate,
        details: `Student: ${s.name}`,
        data: s,
        updated: s.updated
    }));

    const attRecords = attendanceHistory.map(a => ({
        id: a.id,
        type: 'Attendance',
        date: a.date.split('T')[0],
        details: `${a.totalStudents} Students Present (${a.mode})`,
        data: a,
        updated: a.updated
    }));

    const diaryRecords = diaries.map(d => ({
        id: d.id,
        type: 'Diary',
        date: d.date,
        details: `Students: ${d.studentCount}, Volunteers: ${d.volunteers.length}`,
        data: d,
        updated: d.updated
    }));

    return [...admissionRecords, ...attRecords, ...diaryRecords].sort((a,b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  deleteHistoryItem: (id: string, type: string) => {
      if (type === 'Admission') {
          students = students.filter(s => s.id !== id);
          setStorage('students', students);
      } else if (type === 'Attendance') {
          attendanceHistory = attendanceHistory.filter(a => a.id !== id);
          setStorage('attendance', attendanceHistory);
      } else if (type === 'Diary') {
          diaries = diaries.filter(d => d.id !== id);
          setStorage('diaries', diaries);
      }
      return true;
  },

  saveSyllabusProgress: (progressList: SyllabusProgress[]) => {
      const newProgressList = syllabusProgress.filter(existing => 
          !progressList.some(newItem => 
              newItem.centerId === existing.centerId &&
              newItem.week === existing.week &&
              newItem.className === existing.className &&
              newItem.subject === existing.subject
          )
      );
      syllabusProgress = [...newProgressList, ...progressList];
      setStorage('syllabus_progress', syllabusProgress);
      return true;
  },

  getSyllabusProgress: (centerId: string, week: string) => {
      return syllabusProgress.filter(p => p.centerId === centerId && p.week === week);
  },

  getPerformanceStats: () => {
      return [
        { name: 'Week 1', completion: 80, attendance: 90 },
        { name: 'Week 2', completion: 65, attendance: 85 },
        { name: 'Week 3', completion: 75, attendance: 88 },
        { name: 'Week 4', completion: 90, attendance: 92 },
      ];
  },

  registerUser: (volunteerId: string, name: string, password: string) => {
      const vId = volunteerId.toUpperCase().trim();
      if (users.find(u => u.volunteerId === vId)) {
          return { success: false, message: 'Volunteer ID already registered' };
      }
      const newUser = { volunteerId: vId, name, password };
      users.push(newUser);
      setStorage('users', users);
      return { success: true };
  },

  authenticate: (volunteerId: string, password: string) => {
      const vId = volunteerId.toUpperCase().trim();
      const user = users.find(u => u.volunteerId === vId && u.password === password);
      if (user) {
          return { success: true, user };
      }
      return { success: false, message: 'Invalid Volunteer ID or Password' };
  },

  updateUser: (volunteerId: string, updates: { name?: string, password?: string }) => {
     const vId = volunteerId.toUpperCase().trim();
     const userIndex = users.findIndex(u => u.volunteerId === vId);
     if (userIndex !== -1) {
         users[userIndex] = { ...users[userIndex], ...updates };
         setStorage('users', users);
         return { success: true, user: users[userIndex] };
     }
     return { success: false, message: 'User not found' };
  },

  saveFeedback: (feedback: Omit<Feedback, 'id' | 'date'>) => {
      const newFeedback: Feedback = {
          ...feedback,
          id: Date.now().toString(),
          date: new Date().toISOString()
      };
      feedbacks.push(newFeedback);
      setStorage('feedbacks', feedbacks);
      return { success: true };
  }
};
