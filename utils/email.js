const nodemailer = require('nodemailer');
console.log('Nodemailer configuration:', {
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  user: process.env.NODEMAILER_USER,
  // Do not log the password for security reasons
});
const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

exports.sendInviteEmail = async (email, fullName, inviteToken) => {
  const inviteLink = `${process.env.FRONTEND_URL}/setup-password/${inviteToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Task Management System!</h2>
        <p style="color: #666; font-size: 16px;">Hi ${fullName},</p>
        
        <p style="color: #666; font-size: 16px;">
          You have been invited to join our Task Management System. Click the button below to set up your password and get started.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
            Setup Your Password
          </a>
        </div>

        <p style="color: #999; font-size: 12px;">
          If the button doesn't work, copy and paste this link in your browser:<br/>
          ${inviteLink}
        </p>

        <p style="color: #999; font-size: 12px;">
          This link will expire in 24 hours.
        </p>

        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; color: #999; font-size: 12px;">
          <p>Best regards,<br/>Task Management Team</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: 'Welcome to Task Management System - Setup Your Password',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

exports.sendTaskAssignmentEmail = async (email, fullName, taskTitle, dueDate) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">New Task Assigned!</h2>
        <p style="color: #666; font-size: 16px;">Hi ${fullName},</p>
        
        <p style="color: #666; font-size: 16px;">
          A new task has been assigned to you.
        </p>

        <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Task Title:</strong> ${taskTitle}</p>
          <p style="margin: 10px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        </div>

        <p style="color: #666; font-size: 16px;">
          Login to the system to view more details and update the task status.
        </p>

        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; color: #999; font-size: 12px;">
          <p>Best regards,<br/>Task Management Team</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

exports.sendNotificationEmail = async (email, fullName, subject, message) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; font-size: 16px;">Hi ${fullName},</p>
        
        <p style="color: #666; font-size: 16px;">
          ${message}
        </p>

        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; color: #999; font-size: 12px;">
          <p>Best regards,<br/>Task Management Team</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
