const Attendance = require("../models/attendance");
const User = require("../models/User");

// ===============================
// TIMEZONE CONFIGURATION - FIXED
// ===============================
const TIMEZONE = 'Asia/Karachi';

// ✅ FIXED: Get current Pakistan time
const getPakistanTime = () => {
  const now = new Date();
  // Pakistan is UTC+5 (5 hours ahead of UTC)
  const pakistanOffsetMs = 5 * 60 * 60 * 1000;
  return new Date(now.getTime() + pakistanOffsetMs);
};

// ✅ FIXED: Get today's date in Pakistan time
const getToday = () => {
  const now = getPakistanTime();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// OFFICE HOURS CONFIGURATION
const OFFICE_START_HOUR = 9;
const OFFICE_START_MINUTE = 0;
const OFFICE_END_HOUR = 19;
const OFFICE_END_MINUTE = 0;
const LATE_THRESHOLD_MINUTES = 10;

// ===============================
// HELPER FUNCTIONS
// ===============================

function formatTime(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: TIMEZONE
    });
  } catch {
    return '-';
  }
}

function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: TIMEZONE
    });
  } catch {
    return '-';
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ===============================
// CHECK IN
// ===============================
exports.markCheckIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();
    const now = getPakistanTime();

    const officeStartTime = new Date(now);
    officeStartTime.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);
    
    const officeEndTime = new Date(now);
    officeEndTime.setHours(OFFICE_END_HOUR, OFFICE_END_MINUTE, 0, 0);
    
    if (now < officeStartTime) {
      return res.status(400).json({
        success: false,
        message: `Office is closed. Check-in is only allowed after ${OFFICE_START_HOUR}:00 AM`,
      });
    }
    
    if (now > officeEndTime) {
      return res.status(400).json({
        success: false,
        message: `Office is closed. Check-in is only allowed until ${OFFICE_END_HOUR - 12}:00 PM`,
      });
    }

    const lateThreshold = new Date(now);
    lateThreshold.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE + LATE_THRESHOLD_MINUTES, 0, 0);
    const isLate = now > lateThreshold;
    const status = isLate ? 'Late' : 'Present';

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
        status: status,
        currentSessionStartTime: now,
        sessions: [{
          checkIn: now,
          checkOut: null,
          duration: 0
        }],
        accumulatedSeconds: 0,
        totalHours: 0
      });
    } else {
      // Already checked in
      if (attendance.currentSessionStartTime) {
        return res.status(400).json({
          success: false,
          message: "Already checked in",
          status: "check_out",
          accumulatedSeconds: attendance.accumulatedSeconds,
          attendance
        });
      }

      // New session
      attendance.currentSessionStartTime = now;
      attendance.checkOut = null;
      attendance.sessions.push({
        checkIn: now,
        checkOut: null,
        duration: 0
      });
      
      // If employee was marked absent, change status to Late when they check in
      if (attendance.status === 'Absent') {
        attendance.status = 'Late';
        attendance.checkIn = now; // Update check-in time
      } else if (!attendance.status) {
        attendance.status = status;
      }
      
      await attendance.save();
    }

    return res.status(200).json({
      success: true,
      message: `✅ Check-in successful. Marked as ${status}`,
      status: "check_out",
      data: {
        checkIn: formatTime(now),
        date: today,
        status: status,
        isLate: isLate
      },
      accumulatedSeconds: attendance.accumulatedSeconds,
      attendance
    });
  } catch (err) {
    console.error('❌ Check-in error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// CHECK OUT - FIXED
// ===============================
exports.markCheckOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();
    const now = getPakistanTime();

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

    // 🔥 FIX: Get check-in time
    const checkInTime = new Date(attendance.currentSessionStartTime);
    const checkOutTime = now;

    // 🔥 Calculate duration
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const sessionDuration = Math.floor(durationMs / 1000);

    if (sessionDuration < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-out time",
      });
    }

    // 🔥 Get current session
    const sessions = attendance.sessions || [];
    const currentSession = sessions[sessions.length - 1];

    if (!currentSession || !currentSession.checkIn) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    // 🔥 CRITICAL FIX: Store previous accumulated seconds
    const previousAccumulated = attendance.accumulatedSeconds || 0;

    // 🔥 Update current session
    currentSession.checkOut = checkOutTime;
    currentSession.duration = sessionDuration;

    // 🔥 CRITICAL FIX: Add ONLY current session duration to accumulated
    attendance.accumulatedSeconds = previousAccumulated + sessionDuration;
    attendance.currentSessionStartTime = null;
    attendance.checkOut = checkOutTime;
    attendance.totalHours = Number((attendance.accumulatedSeconds / 3600).toFixed(2));

    await attendance.save();

    // 🔥 Debug log
    console.log('📊 Check-out Debug:');
    console.log('Previous Accumulated:', previousAccumulated);
    console.log('Session Duration:', sessionDuration);
    console.log('New Accumulated:', attendance.accumulatedSeconds);
    console.log('Total Hours:', attendance.totalHours);

    return res.status(200).json({
      success: true,
      message: "✅ Check-out successful",
      status: "check_in",
      data: {
        checkIn: formatTime(checkInTime),
        checkOut: formatTime(checkOutTime),
        date: formatDate(today),
        sessionDuration: sessionDuration,
        sessionDurationFormatted: formatDuration(sessionDuration),
        sessionDurationMinutes: Math.floor(sessionDuration / 60),
        accumulatedSeconds: attendance.accumulatedSeconds,
        totalHours: attendance.totalHours,
        totalHoursFormatted: `${attendance.totalHours}h`,
        sessionCount: sessions.length,
      },
      attendance
    });

  } catch (err) {
    console.error('❌ Check-out error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET TIMER STATUS - FIXED
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
        isRunning: false,
        data: {
          status: "Not checked in",
          date: today
        }
      });
    }

    const isRunning = !!attendance.currentSessionStartTime;
    let totalSeconds = attendance.accumulatedSeconds || 0;

    // 🔥 FIX: If running, add current session seconds
    if (isRunning && attendance.currentSessionStartTime) {
      const now = getPakistanTime();
      const checkInTime = new Date(attendance.currentSessionStartTime);
      const currentSessionSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
      totalSeconds = (attendance.accumulatedSeconds || 0) + currentSessionSeconds;
    }

    // 🔥 Calculate total hours from total seconds
    const totalHours = Number((totalSeconds / 3600).toFixed(2));

    return res.status(200).json({
      success: true,
      status: isRunning ? "check_out" : "check_in",
      accumulatedSeconds: totalSeconds,
      isRunning: isRunning,
      data: {
        checkIn: attendance.checkIn ? formatTime(attendance.checkIn) : null,
        checkOut: attendance.checkOut ? formatTime(attendance.checkOut) : null,
        date: formatDate(today),
        totalHours: totalHours,
        totalHoursFormatted: `${totalHours}h`,
        sessionCount: attendance.sessions?.length || 0,
        accumulatedSeconds: attendance.accumulatedSeconds || 0,
        currentSessionSeconds: isRunning ? Math.floor((getPakistanTime().getTime() - new Date(attendance.currentSessionStartTime).getTime()) / 1000) : 0
      },
      attendance
    });
  } catch (err) {
    console.error('❌ getTimerStatus error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// GET TODAY ATTENDANCE - FIXED
// ===============================
exports.getTodayAttendance = async (req, res) => {
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
        isRunning: false,
        data: {
          date: today,
          status: 'Absent',
          totalHours: 0,
          sessionCount: 0
        }
      });
    }

    const isRunning = !!attendance.currentSessionStartTime;
    let totalSeconds = attendance.accumulatedSeconds || 0;

    if (isRunning && attendance.currentSessionStartTime) {
      const now = getPakistanTime();
      const checkInTime = new Date(attendance.currentSessionStartTime);
      const currentSessionSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
      totalSeconds = (attendance.accumulatedSeconds || 0) + currentSessionSeconds;
    }

    const totalHours = Number((totalSeconds / 3600).toFixed(2));

    return res.status(200).json({
      success: true,
      status: isRunning ? "check_out" : "check_in",
      accumulatedSeconds: totalSeconds,
      isRunning: isRunning,
      data: {
        date: today,
        status: attendance.status || 'Absent',
        totalHours: totalHours,
        totalHoursFormatted: `${totalHours}h`,
        sessionCount: attendance.sessions?.length || 0,
        checkIn: attendance.checkIn ? formatTime(attendance.checkIn) : null,
        checkOut: attendance.checkOut ? formatTime(attendance.checkOut) : null
      },
      attendance
    });
  } catch (err) {
    console.error('❌ getTodayAttendance error:', err);
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
      .populate('employeeId', 'fullName email employeeId')
      .sort({ date: -1, createdAt: -1 });

    // Format each record
    const formattedAttendance = attendance.map(record => {
      const totalHours = Number(((record.accumulatedSeconds || 0) / 3600).toFixed(2));
      
      return {
        _id: record._id,
        date: record.date,
        checkIn: record.checkIn ? formatTime(record.checkIn) : '-',
        checkOut: record.checkOut ? formatTime(record.checkOut) : '-',
        status: record.status || 'Absent',
        totalHours: totalHours,
        totalHoursFormatted: `${totalHours}h`,
        sessionCount: record.sessions?.length || 0,
        sessions: record.sessions || [],
        createdAt: record.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedAttendance.length,
      attendance: formattedAttendance,
    });
  } catch (err) {
    console.error('❌ getMyAttendance error:', err);
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
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      employeeId,
      status 
    } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate("employeeId", "fullName email role employeeId")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(query)
    ]);

    const attendanceWithStatus = attendance.map(record => {
      let statusText = 'Absent';
      const totalHours = Number(((record.accumulatedSeconds || 0) / 3600).toFixed(2));
      
      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(record.checkIn);
        const lateThreshold = new Date(record.checkIn);
        lateThreshold.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE + LATE_THRESHOLD_MINUTES, 0, 0);
        
        if (checkInTime > lateThreshold) {
          statusText = 'Late';
        } else {
          statusText = 'Present';
        }
      } else if (record.checkIn && !record.checkOut) {
        statusText = 'Present';
      }

      const employee = record.employeeId || {};
      
      return {
        _id: record._id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: statusText,
        totalHours: totalHours,
        totalHoursFormatted: `${totalHours}h`,
        accumulatedSeconds: record.accumulatedSeconds || 0,
        sessionCount: record.sessions?.length || 0,
        sessions: record.sessions || [],
        employeeId: employee.employeeId || employee._id || 'N/A',
        fullName: employee.fullName || 'Unknown',
        email: employee.email || '',
        employeeRef: record.employeeId,
        createdAt: record.createdAt
      };
    });

    let filteredData = attendanceWithStatus;
    if (status && status !== 'all') {
      filteredData = attendanceWithStatus.filter(record => 
        record.status.toLowerCase() === status.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: filteredData.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limitNum),
      attendance: filteredData,
    });
  } catch (err) {
    console.error('❌ getAllAttendance error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.autoMarkAbsentAttendance = async (req, res) => {
  try {
    const today = getToday();
    
    // Get all active employees
    const employees = await User.find({ 
      isActive: true,
      role: 'employee'
    });
    
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found'
      });
    }
    
    let markedAbsentCount = 0;
    let alreadyMarkedCount = 0;
    const absentEmployees = [];
    const alreadyMarkedEmployees = [];
    
    for (const employee of employees) {
      // Check if attendance already exists for today
      const existingAttendance = await Attendance.findOne({
        employeeId: employee._id,
        date: today
      });
      
      // If attendance already exists, skip
      if (existingAttendance) {
        alreadyMarkedCount++;
        alreadyMarkedEmployees.push({
          name: employee.fullName,
          email: employee.email,
          status: existingAttendance.status
        });
        continue;
      }
      
      // Create ABSENT attendance record
      const attendance = new Attendance({
        employeeId: employee._id,
        date: today,
        checkIn: null,        // No check-in
        checkOut: null,       // No check-out
        status: 'Absent',         // Marked as Absent
        totalHours: 0,            // 0 hours worked
        sessions: [],             // No sessions
        currentSessionStartTime: null,
        accumulatedSeconds: 0
      });
      
      await attendance.save();
      markedAbsentCount++;
      absentEmployees.push({
        name: employee.fullName,
        email: employee.email,
        status: 'Absent'
      });
    }
    
    // Log the operation
    console.log(`✅ Auto-Absent marking completed at ${new Date().toLocaleString()}`);
    console.log(`📊 Total Employees: ${employees.length}`);
    console.log(`❌ Marked Absent: ${markedAbsentCount}`);
    console.log(`✅ Already Marked: ${alreadyMarkedCount}`);
    
    return res.status(200).json({
      success: true,
      message: 'Auto-absent attendance marked successfully',
      data: {
        date: today,
        totalEmployees: employees.length,
        markedAbsent: markedAbsentCount,
        alreadyMarked: alreadyMarkedCount,
        absentEmployees: absentEmployees,
        alreadyMarkedEmployees: alreadyMarkedEmployees,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error in auto-absent marking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark absent attendance',
      error: error.message
    });
  }
};