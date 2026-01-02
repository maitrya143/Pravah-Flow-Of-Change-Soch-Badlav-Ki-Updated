
import express from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Attendance } from '../models/Attendance';
import { Diary } from '../models/Diary';
import { Feedback } from '../models/Feedback';

const router = express.Router();

// --- AUTH ---

router.post('/auth/register', async (req, res) => {
  try {
    const { volunteerId, name, password } = req.body;
    const existing = await User.findOne({ volunteerId });
    if (existing) return res.status(400).json({ success: false, message: 'ID already exists' });

    const newUser = new User({ volunteerId, name, password });
    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { volunteerId, password } = req.body;
    const user = await User.findOne({ volunteerId, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/auth/update/:volunteerId', async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { volunteerId: req.params.volunteerId },
            { $set: req.body },
            { new: true }
        );
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

// --- STUDENTS ---

router.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

router.post('/students', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error creating student' });
    }
});

// --- ATTENDANCE ---

router.get('/attendance', async (req, res) => {
    try {
        const records = await Attendance.find().sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
});

router.post('/attendance', async (req, res) => {
    try {
        const record = new Attendance(req.body);
        await record.save();
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Error saving attendance' });
    }
});

router.get('/attendance/monthly-summary', async (req, res) => {
    try {
        const { centerId, classId, month, year } = req.query;
        
        const targetMonth = parseInt(month as string);
        const targetYear = parseInt(year as string);
        
        // 1. Get Students
        const studentQuery: any = { centerId };
        if (classId && classId !== 'All') {
            studentQuery.classLevel = classId;
        }
        const students = await Student.find(studentQuery);

        // 2. Get Attendance Records for the month
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of month
        
        const attendanceRecords = await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
            centerId: centerId // Assuming attendance records have centerId
        });

        const workingDays = attendanceRecords.length;

        // 3. Calculate Stats
        const studentStats = students.map(student => {
            const presentCount = attendanceRecords.filter(r => 
                r.presentStudentIds.includes(student.id)
            ).length;

            return {
                studentId: student.id,
                name: student.name,
                presentDays: presentCount,
                percentage: workingDays > 0 ? (presentCount / workingDays) * 100 : 0
            };
        });

        const totalPercent = studentStats.reduce((acc, curr) => acc + curr.percentage, 0);
        const avgAttendance = students.length > 0 ? totalPercent / students.length : 0;

        res.json({
            month: startDate.toLocaleString('default', { month: 'long' }),
            year: targetYear,
            className: classId || 'All',
            workingDays,
            averageAttendance: avgAttendance,
            totalStudents: students.length,
            studentStats
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating monthly report' });
    }
});

// --- DIARY ---

router.get('/diary', async (req, res) => {
    try {
        const records = await Diary.find().sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching diary' });
    }
});

router.post('/diary', async (req, res) => {
    try {
        const entry = new Diary(req.body);
        await entry.save();
        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: 'Error saving diary' });
    }
});

// --- FEEDBACK ---

router.post('/feedback', async (req, res) => {
    try {
        const feedback = new Feedback(req.body);
        await feedback.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

export default router;