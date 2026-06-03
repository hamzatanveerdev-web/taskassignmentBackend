const axios = require("axios");

const sendEmail = async (to, toName, subject, htmlContent) => {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Task Manager", email: process.env.NODEMAILER_USER },
      to: [{ email: to, name: toName }],
      subject: subject,
      htmlContent: htmlContent,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// ================= SEND INVITE EMAIL =================
exports.sendInviteEmail = async (email, fullName, inviteToken) => {
  try {
    const inviteLink = `${process.env.FRONTEND_URL}/setup-password/${inviteToken}`;
    await sendEmail(email, fullName, "Welcome - Setup Your Password", `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to Task Management System!</h2>
          <p style="color: #666;">Hi ${fullName},</p>
          <p style="color: #666;">You have been invited to join our Task Management System.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Setup Your Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">If button doesn't work:<br/>${inviteLink}</p>
          <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
          <hr/>
          <p style="color: #999; font-size: 12px;">Best regards,<br/>Task Management Team</p>
        </div>
      </div>
    `);
    console.log("EMAIL SENT successfully");
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.log("EMAIL SENDING ERROR:", error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// ================= TASK ASSIGNMENT EMAIL =================
exports.sendTaskAssignmentEmail = async (email, fullName, taskTitle, dueDate) => {
  try {
    await sendEmail(email, fullName, `New Task Assigned: ${taskTitle}`, `
      <h2>New Task Assigned</h2>
      <p>Hello ${fullName},</p>
      <p>A new task has been assigned to you.</p>
      <p><strong>Task:</strong> ${taskTitle}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
    `);
    console.log("TASK EMAIL SENT successfully");
    return { success: true };
  } catch (error) {
    console.log("TASK EMAIL ERROR:", error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// ================= NOTIFICATION EMAIL =================
exports.sendNotificationEmail = async (email, fullName, subject, message) => {
  try {
    await sendEmail(email, fullName, subject, `
      <h2>${subject}</h2>
      <p>Hello ${fullName},</p>
      <p>${message}</p>
    `);
    console.log("NOTIFICATION EMAIL SENT successfully");
    return { success: true };
  } catch (error) {
    console.log("NOTIFICATION EMAIL ERROR:", error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};