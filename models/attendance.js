// models/Attendance.js

const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String, // "2026-06-16"
      required: true,
      index: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    totalHours: {
      type: Number,
      default: 0,
    },

    // Support for multiple sessions per day
    sessions: [{
      checkIn: {
        type: Date,
        required: true
      },
      checkOut: {
        type: Date,
        default: null
      },
      duration: {
        type: Number,
        default: 0 // in seconds
      }
    }],

    // Current session tracking
    currentSessionStartTime: {
      type: Date,
      default: null
    },

    // Accumulated time for today (in seconds)
    accumulatedSeconds: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Prevent duplicate attendance per day per employee
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);