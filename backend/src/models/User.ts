import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  volunteerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // In production, hash this!
  centerId: { type: String },
  centerName: { type: String }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);