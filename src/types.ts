
export type CityCode = 'MDA' | 'NGP';

export interface Center {
  id: string;
  name: string;
  cityCode: CityCode;
  shortCode: string;
}

export interface User {
  volunteerId: string;
  name: string;
  centerId: string;
  centerName: string;
}

export interface Student {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  age: number;
  classLevel: string;
  schoolName: string;
  parentName: string;
  parentOccupation: string;
  aadhaar: string;
  contact: string;
  registrationNumber: string;
  admissionDate: string;
  centerId: string;
  admissionFormFile?: string;
  updated?: boolean;
  lastUpdated?: string;
}

export interface SubjectScore {
  subject: string;
  score: number;
  grade: string;
  remarks?: string;
}

export interface StudentPerformance {
  id: string;
  studentId: string;
  testName: string;
  date: string;
  scores: SubjectScore[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  presentStudentIds: string[];
  mode: 'QR' | 'MANUAL';
  totalStudents: number;
  updated?: boolean;
  lastUpdated?: string;
}

export interface DiaryVolunteerEntry {
  volunteerId: string;
  name: string;
  inTime: string;
  outTime: string;
  status: 'Present' | 'Absent';
  classHandled: string;
  subject: string;
  topic: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  studentCount: number;
  inTime: string;
  outTime: string;
  thought: string;
  volunteers: DiaryVolunteerEntry[];
  updated?: boolean;
  lastUpdated?: string;
}

export interface SyllabusTopic {
  subject: string;
  topics: string[];
}

export interface ClassSyllabus {
  className: string;
  subjects: SyllabusTopic[];
}

export interface SyllabusProgress {
  id: string;
  centerId: string;
  week: string;
  className: string;
  subject: string;
  percentage: number;
  lastUpdated: string;
}

export interface Feedback {
  id: string;
  volunteerId: string;
  volunteerName: string;
  centerId: string;
  subject: string;
  message: string;
  date: string;
}

export interface StudentMonthlyStat {
  studentId: string;
  name: string;
  presentDays: number;
  percentage: number;
}

export interface MonthlyReportData {
  month: string;
  year: number;
  className: string;
  workingDays: number;
  averageAttendance: number;
  totalStudents: number;
  studentStats: StudentMonthlyStat[];
}

export type ViewState = 
  | 'LOGIN' 
  | 'REGISTER'
  | 'CENTER_SELECT' 
  | 'DASHBOARD' 
  | 'ADMISSION' 
  | 'GENERATE_QR'
  | 'QR_SCAN' 
  | 'MANUAL_ATTENDANCE' 
  | 'MONTHLY_ATTENDANCE'
  | 'DIARY' 
  | 'SYLLABUS' 
  | 'PERFORMANCE' 
  | 'HISTORY'
  | 'SETTINGS'
  | 'EDIT_ADMISSION'
  | 'EDIT_ATTENDANCE'
  | 'EDIT_DIARY';
