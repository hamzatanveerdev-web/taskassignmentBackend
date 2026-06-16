const mongoose = require('mongoose');
//mongo db schema for employee attendance store 
const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    date: {
      type: String, // "2026-06-16"
      required: true,
    },

    checkIn: {
      type: String, // "09:00:00"
      default: null,
    },

    checkOut: {
      type: String,
      default: null,
    },

    totalHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// prevent duplicate attendance per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);