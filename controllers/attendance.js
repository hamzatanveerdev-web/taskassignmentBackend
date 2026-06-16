const Attendance = require('../models/Attendance');

// Check In
exports.markCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    // Prevent duplicate check-in
    if (attendance?.checkIn) {
      return res.status(400).json({
        success: false,
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

    res.status(200).json({
      success: true,
      message: 'Check in successful',
      attendance,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Check Out
exports.markCheckOut = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Please check in first',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
      });
    }

    attendance.checkOut = new Date();

    const diff =
      attendance.checkOut - attendance.checkIn;

    attendance.totalHours = Number(
      (diff / (1000 * 60 * 60)).toFixed(2)
    );

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check out successful',
      attendance,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Employee Attendance History
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const attendance =
      await Attendance.find({
        employeeId,
      }).sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Admin View All
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance =
      await Attendance.find()
        .populate(
          'employeeId',
          'fullName email'
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};