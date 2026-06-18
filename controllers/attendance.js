// controllers/attendanceController.js

const Attendance = require("../models/attendance");

// GET TODAY DATE HELPER
const getToday = () => new Date().toISOString().split("T")[0];


// ===============================
// CHECK IN (START TIMER)
// ===============================
exports.markCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();
    const now = new Date();

    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      // First check-in of the day
      attendance = await Attendance.create({
        employeeId,
        date: today,
        checkIn: now,
        currentSessionStartTime: now,
        sessions: [{
          checkIn: now,
          checkOut: null,
          duration: 0
        }],
        accumulatedSeconds: 0
      });
    } else {
      // Already checked in and timer is running
      if (attendance.currentSessionStartTime) {
        return res.status(400).json({
          success: false,
          message: "Already checked in",
          status: "check_out",
          accumulatedSeconds: attendance.accumulatedSeconds,
          attendance
        });
      }

      // New session (re-check-in after checkout)
      attendance.currentSessionStartTime = now;
      attendance.checkOut = null; // Reset checkout for new session
      attendance.sessions.push({
        checkIn: now,
        checkOut: null,
        duration: 0
      });
      await attendance.save();
    }

    return res.status(200).json({
      success: true,
      message: "Check-in successful",
      status: "check_out",
      accumulatedSeconds: attendance.accumulatedSeconds,
      attendance
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// CHECK OUT (STOP TIMER)
// ===============================
exports.markCheckOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();
    const now = new Date();

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

    if (!attendance.currentSessionStartTime) {
      return res.status(400).json({
        success: false,
        message: "Not currently checked in",
      });
    }

    // Calculate session duration
    const sessionDuration = Math.floor((now - attendance.currentSessionStartTime) / 1000); // in seconds

    // Update the current session
    const currentSession = attendance.sessions[attendance.sessions.length - 1];
    currentSession.checkOut = now;
    currentSession.duration = sessionDuration;

    // Add to accumulated time
    attendance.accumulatedSeconds += sessionDuration;
    attendance.currentSessionStartTime = null;
    attendance.checkOut = now;

    // Calculate total hours
    attendance.totalHours = Number(
      (attendance.accumulatedSeconds / (60 * 60)).toFixed(2)
    );

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      status: "check_in",
      accumulatedSeconds: attendance.accumulatedSeconds,
      sessionDuration: sessionDuration,
      attendance
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ===============================
// GET TIMER STATUS
// ===============================
exports.getTimerStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();

    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        status: "check_in",
        accumulatedSeconds: 0,
        isRunning: false
      });
    }

    const isRunning = !!attendance.currentSessionStartTime;
    let currentSessionSeconds = 0;

    if (isRunning && attendance.currentSessionStartTime) {
      // Calculate current session duration
      currentSessionSeconds = Math.floor((new Date() - attendance.currentSessionStartTime) / 1000);
    }

    return res.status(200).json({
      success: true,
      status: isRunning ? "check_out" : "check_in",
      accumulatedSeconds: attendance.accumulatedSeconds + currentSessionSeconds,
      isRunning,
      currentSessionSeconds,
      attendance
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

    const isRunning = attendance?.currentSessionStartTime ? true : false;

    return res.status(200).json({
      success: true,
      status: isRunning ? "check_out" : "check_in",
      accumulatedSeconds: attendance?.accumulatedSeconds || 0,
      isRunning,
      attendance
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
