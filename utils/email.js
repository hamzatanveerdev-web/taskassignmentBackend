const nodemailer = require("nodemailer");

console.log("Nodemailer configuration:", {
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  user: process.env.NODEMAILER_USER,
});

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
  },

  // Fix timeout issues on Render
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,

  tls: {
    rejectUnauthorized: false,
  },
});
const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    await transporter.verify();
    console.log("SMTP SERVER READY");
  } catch (error) {
    console.log("SMTP VERIFY ERROR:", error);
  }
})();
// ================= SEND INVITE EMAIL =================

exports.sendInviteEmail = async (email, fullName, inviteToken) => {
  try {
    const inviteLink = `${process.env.FRONTEND_URL}/setup-password/${inviteToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to Task Management System!</h2>

          <p style="color: #666; font-size: 16px;">
            Hi ${fullName},
          </p>

          <p style="color: #666; font-size: 16px;">
            You have been invited to join our Task Management System.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="${inviteLink}" 
              style="
                background-color: #007bff;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
              "
            >
              Setup Your Password
            </a>
          </div>

          <p style="color: #999; font-size: 12px;">
            If button doesn't work:
            <br />
            ${inviteLink}
          </p>

          <p style="color: #999; font-size: 12px;">
            This link expires in 24 hours.
          </p>

          <hr />

          <p style="color: #999; font-size: 12px;">
            Best regards,
            <br />
            Task Management Team
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Task Manager" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: "Welcome - Setup Your Password",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("EMAIL SENT:", info.response);

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.log("EMAIL SENDING ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// ================= TASK ASSIGNMENT EMAIL =================

exports.sendTaskAssignmentEmail = async (
  email,
  fullName,
  taskTitle,
  dueDate
) => {
  try {
    const htmlContent = `
      <h2>New Task Assigned</h2>

      <p>Hello ${fullName},</p>

      <p>A new task has been assigned to you.</p>

      <p>
        <strong>Task:</strong> ${taskTitle}
      </p>

      <p>
        <strong>Due Date:</strong> 
        ${new Date(dueDate).toLocaleDateString()}
      </p>
    `;

    const mailOptions = {
      from: `"Task Manager" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: `New Task Assigned: ${taskTitle}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("TASK EMAIL SENT:", info.response);

    return {
      success: true,
    };
  } catch (error) {
    console.log("TASK EMAIL ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

// ================= NOTIFICATION EMAIL =================

exports.sendNotificationEmail = async (
  email,
  fullName,
  subject,
  message
) => {
  try {
    const htmlContent = `
      <h2>${subject}</h2>

      <p>Hello ${fullName},</p>

      <p>${message}</p>
    `;

    const mailOptions = {
      from: `"Task Manager" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("NOTIFICATION EMAIL SENT:", info.response);

    return {
      success: true,
    };
  } catch (error) {
    console.log("NOTIFICATION EMAIL ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};
