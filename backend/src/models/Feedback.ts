import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  volunteerId: { type: String, required: true },
  volunteerName: { type: String, required: true },
  centerId: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

export const Feedback = mongoose.model('Feedback', FeedbackSchema);