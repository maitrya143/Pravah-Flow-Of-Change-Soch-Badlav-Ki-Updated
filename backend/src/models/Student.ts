import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom ID: 25NGP...
  name: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  dob: { type: String, required: true },
  age: { type: Number, required: true },
  classLevel: { type: String, required: true },
  schoolName: { type: String, required: true },
  parentName: { type: String, required: true },
  parentOccupation: { type: String },
  aadhaar: { type: String },
  contact: { type: String, required: true },
  registrationNumber: { type: String },
  admissionDate: { type: String, required: true },
  centerId: { type: String, required: true }
}, { timestamps: true });

export const Student = mongoose.model('Student', StudentSchema);