const Attendance = require('../models/Attendance');

exports.markCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.id; // token se lo (BEST PRACTICE)

    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        message: 'Already checked in today',
      });
    }

    if (!attendance) {
      attendance = await Attendance.create({
        employeeId,
        date: today,
        checkIn: new Date(),
      });
    } else {
      attendance.checkIn = new Date();
      await attendance.save();
    }

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};










exports.markCheckOut = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Check-in first required' });
    }

    attendance.checkOut = new Date();

    // calculate hours
    const diff =
      new Date(attendance.checkOut) - new Date(attendance.checkIn);

    attendance.totalHours = diff / (1000 * 60 * 60);

    await attendance.save();

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};