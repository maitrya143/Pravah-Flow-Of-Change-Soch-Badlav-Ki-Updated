import { Center, CityCode, ClassSyllabus } from './types';

export const CITIES: Record<CityCode, string> = {
  MDA: 'Mouda',
  NGP: 'Nagpur',
};

// Ensure logo.png is in your public folder
export const LOGO_URL = "/logo.png";

export const CENTERS: Center[] = [
  // Mouda Centers
  { id: 'MDA01', name: 'Nathnagar', cityCode: 'MDA', shortCode: 'NAT' },
  { id: 'MDA02', name: 'Gurdeo Chowk', cityCode: 'MDA', shortCode: 'GUR' },
  { id: 'MDA03', name: 'Krishna Mandir', cityCode: 'MDA', shortCode: 'KRI' },
  { id: 'MDA04', name: 'Dahali', cityCode: 'MDA', shortCode: 'DAH' },
  { id: 'MDA05', name: 'Kumbhari', cityCode: 'MDA', shortCode: 'KUM' },
  { id: 'MDA06', name: 'Rahadi', cityCode: 'MDA', shortCode: 'RAH' },
  { id: 'MDA07', name: 'Lapka', cityCode: 'MDA', shortCode: 'LAP' },
  { id: 'MDA08', name: 'Mathani', cityCode: 'MDA', shortCode: 'MAT' },
  { id: 'MDA09', name: 'Wadoda', cityCode: 'MDA', shortCode: 'WAD' },
  { id: 'MDA10', name: 'Isapur', cityCode: 'MDA', shortCode: 'ISA' },
  
  // Nagpur Centers
  { id: 'NGP01', name: 'SitaBuldi Footpathshala', cityCode: 'NGP', shortCode: 'SBF' },
  { id: 'NGP02', name: 'Wardhaman Nagar SDC', cityCode: 'NGP', shortCode: 'WNS' },
  { id: 'NGP03', name: 'IT Park', cityCode: 'NGP', shortCode: 'ITP' },
  { id: 'NGP04', name: 'Laxmi Nagar', cityCode: 'NGP', shortCode: 'LAX' },
  { id: 'NGP05', name: 'Sakkardara SDC', cityCode: 'NGP', shortCode: 'SDS' },
  { id: 'NGP06', name: 'Jagdish Nagar', cityCode: 'NGP', shortCode: 'JAG' },
  { id: 'NGP07', name: 'Sakkardara Square', cityCode: 'NGP', shortCode: 'SKS' },
  { id: 'NGP08', name: 'Mount Road', cityCode: 'NGP', shortCode: 'MTR' },
  { id: 'NGP09', name: 'Wardhaman Nagar', cityCode: 'NGP', shortCode: 'WN' },
  { id: 'NGP10', name: 'Gandhinagar', cityCode: 'NGP', shortCode: 'GAN' },
];

export const PRIMARY_SYLLABUS: ClassSyllabus[] = [
  {
    className: 'Class 1st',
    subjects: [
      { subject: 'Maths', topics: ['Subtraction (single digit)'] },
      { subject: 'English', topics: ['Action words', 'Simple present tense', 'Opposite words (singular & plural)'] },
      { subject: 'Hindi', topics: ['शब्द परिचय (छोटे शब्द)'] },
      { subject: 'Values & GK', topics: ['My Family and Helpers Around Us (General Knowledge)'] }
    ]
  },
  {
    className: 'Class 2nd',
    subjects: [
      { subject: 'Maths', topics: ['Multiplication (2-digit × 1-digit)', 'Tables (2–10)'] },
      { subject: 'English', topics: ['Verbs (present tense)', 'Sentence types'] },
      { subject: 'Hindi', topics: ['सर्वनाम (Pronoun)'] },
      { subject: 'Values & GK', topics: ['Festivals of India (General Knowledge)'] }
    ]
  },
  {
    className: 'Class 3rd',
    subjects: [
      { subject: 'Maths', topics: ['Multiplication (3-digit × 2-digit)', 'Table up to 20'] },
      { subject: 'English', topics: ['Tenses (simple present, past, future)'] },
      { subject: 'Hindi', topics: ['शब्द भंडार (Unseen Passage)'] },
      { subject: 'Science', topics: ['Nutrition in living organisms', 'Measurement of physical quantities'] }
    ]
  },
  {
    className: 'Class 4th',
    subjects: [
      { subject: 'Maths', topics: ['Division (3-digit ÷ 2-digit)'] },
      { subject: 'English', topics: ['Tenses (continuous & perfect)'] },
      { subject: 'Hindi', topics: ['शब्द भंडार (basic meaning of words)'] },
      { subject: 'Science', topics: ['Substances & their surroundings', 'Nutrition and diet'] },
      { subject: 'Values & GK', topics: ['Indian Monuments and Famous Places (General Knowledge)'] }
    ]
  },
  {
    className: 'Class 5th',
    subjects: [
      { subject: 'Maths', topics: ['Fractions (operations)'] },
      { subject: 'English', topics: ['Minute and Hour'] },
      { subject: 'Hindi', topics: ['शब्द भंडार (Unseen Passage)'] },
      { subject: 'Science', topics: ['Nutrition in living organisms', 'Measurement of physical quantities'] },
      { subject: 'Values & GK', topics: ['Introduction to Maps and Indian States (General Knowledge)'] }
    ]
  },
  {
    className: 'Class 6th',
    subjects: [
      { subject: 'Maths', topics: ['HCF / LCM', 'Divisibility'] },
      { subject: 'English', topics: ['Journey to the West', 'Tenses (past, present, future)'] },
      { subject: 'Science', topics: ['Substances & their types', 'Living and Non-Living things'] }
    ]
  },
  {
    className: 'Class 7th',
    subjects: [
      { subject: 'Maths', topics: ['Angles and pair of angles', 'Operation on Rational Numbers'] },
      { subject: 'English', topics: ['The Kids (Unseen passage)', 'Tenses', 'Phrases & Their Types'] },
      { subject: 'Science', topics: ['Heat', 'Electricity and Magnetism'] }
    ]
  },
  {
    className: 'Class 8th',
    subjects: [
      { subject: 'Maths', topics: ['Altitude and Median of a Triangle', 'Linear Equations', 'Algebraic Expressions'] },
      { subject: 'English', topics: ['The Treasure Within', 'Sentence & Types', 'Determiners', 'Tenses (past, present, future)'] },
      { subject: 'Science', topics: ['Force & Pressure', 'Metals and Non-Metals'] }
    ]
  }
];