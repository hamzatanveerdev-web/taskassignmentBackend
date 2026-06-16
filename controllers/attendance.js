// controllers/attendanceController.js

const Attendance = require("../models/Attendance");

// GET TODAY DATE HELPER
const getToday = () => new Date().toISOString().split("T")[0];


// ===============================
// CHECK IN
// ===============================
exports.markCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();

    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    // Already checked in
    if (attendance?.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today",
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

    return res.status(200).json({
      success: true,
      message: "Check-in successful",
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// CHECK OUT
// ===============================
exports.markCheckOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Please check in first",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: "Already checked out today",
      });
    }

    attendance.checkOut = new Date();

    // Calculate total hours
    if (attendance.checkIn) {
      const diff = attendance.checkOut - attendance.checkIn;
      attendance.totalHours = Number(
        (diff / (1000 * 60 * 60)).toFixed(2)
      );
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// GET MY ATTENDANCE HISTORY
// ===============================
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const attendance = await Attendance.find({ employeeId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// GET TODAY STATUS (IMPORTANT FOR UI)
// ===============================
exports.getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    return res.status(200).json({
      success: true,
      status: attendance
        ? attendance.checkOut
          ? "check_out"
          : "check_in"
        : "check_in",
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// ADMIN - ALL ATTENDANCE
// ===============================
exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("employeeId", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};