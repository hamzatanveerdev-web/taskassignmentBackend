const User = require("../models/User");
const crypto = require("crypto");
const { generateInviteToken } = require("../utils/auth");
const { sendInviteEmail } = require("../utils/email");

exports.getAllEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employees = await User.find({ role: "employee" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role: "employee" });

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addEmployee = async (req, res, next) => {
  const { fullName, email, role } = req.body;

  if (!fullName || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide full name and email" });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already exists with this email",
        });
    }

    const { inviteToken, hashedToken } = generateInviteToken();

    const user = new User({
      fullName,
      email,
      role: role || "employee",
      inviteToken: hashedToken,
      inviteTokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdBy: req.user.id,
    });

    await user.save();

    // Send invitation email
<<<<<<< HEAD
    const emailResult = await sendInviteEmail(email, fullName, inviteToken);
=======
   const emailResult = await sendInviteEmail(email, fullName, inviteToken);

    console.log("EMAIL RESULT:", emailResult);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Email sending failed",
        error: emailResult.error,
      });
    }
>>>>>>> 9e2820e4e909b5bf66c0e60856d8d479a02f82b7

    console.log("EMAIL RESULT:", emailResult);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Email sending failed",
        error: emailResult.error,
      });
    }

    
    res.status(201).json({
      success: true,
      message: "Employee added and invitation sent",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res, next) => {
  const { id } = req.params;
  const { fullName, email, isActive } = req.body;

  try {
    let user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (typeof isActive !== "undefined") user.isActive = isActive;

    user = await user.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchEmployees = async (req, res, next) => {
  const { search } = req.query;

  try {
    const employees = await User.find({
      role: "employee",
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
