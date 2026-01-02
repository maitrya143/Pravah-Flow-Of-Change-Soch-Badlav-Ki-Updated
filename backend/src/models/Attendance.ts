import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  mode: { type: String, enum: ['QR', 'MANUAL'], required: true },
  totalStudents: { type: Number, required: true },
  presentStudentIds: [{ type: String }],
  centerId: { type: String } // Optional: to filter by center in backend
}, { timestamps: true });

export const Attendance = mongoose.model('Attendance', AttendanceSchema);