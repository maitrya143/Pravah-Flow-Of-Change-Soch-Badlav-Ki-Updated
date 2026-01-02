import mongoose from 'mongoose';

const VolunteerEntrySchema = new mongoose.Schema({
  volunteerId: String,
  name: String,
  inTime: String,
  outTime: String,
  status: String,
  classHandled: String,
  subject: String,
  topic: String
});

const DiarySchema = new mongoose.Schema({
  date: { type: String, required: true },
  centerId: { type: String, required: true },
  studentCount: { type: Number, required: true },
  inTime: String,
  outTime: String,
  thought: String,
  volunteers: [VolunteerEntrySchema]
}, { timestamps: true });

export const Diary = mongoose.model('Diary', DiarySchema);
