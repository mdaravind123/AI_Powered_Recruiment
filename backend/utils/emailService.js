import nodemailer from 'nodemailer';

// Configure nodemailer transporter
// Note: Update these with your actual email credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Send interview scheduled email to candidate
 */
export const sendInterviewScheduledEmail = async (interviewDetails) => {
  try {
    const {
      candidateEmail,
      candidateName,
      recruiterName,
      companyName,
      jobTitle,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      location,
      additionalNotes
    } = interviewDetails;

    // Format date for better readability
    const dateObj = new Date(interviewDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create email content
    const locationInfo =
      interviewType === 'online'
        ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" target="_blank">${meetingLink}</a></p>`
        : `<p><strong>Location:</strong> ${location}</p>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail-row { margin-bottom: 15px; }
            .detail-row strong { color: #007bff; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Scheduled!</h1>
            </div>
            <div class="content">
              <p>Dear ${candidateName},</p>
              
              <p>Great news! We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>

              <div class="detail-row">
                <strong>📅 Date:</strong> ${formattedDate}
              </div>

              <div class="detail-row">
                <strong>⏰ Time:</strong> ${interviewTime}
              </div>

              <div class="detail-row">
                <strong>📱 Type:</strong> ${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)}
              </div>

              ${interviewType === 'online' ? `<div class="detail-row">${locationInfo}</div>` : `<div class="detail-row">${locationInfo}</div>`}

              <div class="detail-row">
                <strong>👤 Interviewer:</strong> ${recruiterName}
              </div>

              ${additionalNotes ? `<div class="detail-row"><strong>📝 Additional Notes:</strong><br>${additionalNotes}</div>` : ''}

              <p style="margin-top: 20px; color: #666;">
                Please mark your calendar and make sure to be available at the scheduled time. 
                If you need to reschedule, please reply to this email as soon as possible.
              </p>

              <div class="footer">
                <p>Best regards,<br><strong>${companyName}</strong> Recruitment Team</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@airecruiter.com',
      to: candidateEmail,
      subject: `Interview Scheduled - ${jobTitle} at ${companyName}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Interview email sent to ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error('Error sending interview email:', err);
    throw err;
  }
};

/**
 * Send interview reminder email to candidate (24 hours before)
 */
export const sendInterviewReminderEmail = async (interviewDetails) => {
  try {
    const {
      candidateEmail,
      candidateName,
      recruiterName,
      companyName,
      jobTitle,
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      location
    } = interviewDetails;

    const dateObj = new Date(interviewDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail-row { margin-bottom: 15px; }
            .detail-row strong { color: #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Interview Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${candidateName},</p>
              
              <p>This is a friendly reminder about your upcoming interview scheduled for <strong>${formattedDate} at ${interviewTime}</strong>.</p>

              <div class="detail-row">
                <strong>Position:</strong> ${jobTitle}
              </div>

              <div class="detail-row">
                <strong>Company:</strong> ${companyName}
              </div>

              <div class="detail-row">
                <strong>Interviewer:</strong> ${recruiterName}
              </div>

              ${interviewType === 'online' ? `<div class="detail-row"><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></div>` : `<div class="detail-row"><strong>Location:</strong> ${location}</div>`}

              <p>Please make sure to:</p>
              <ul>
                <li>Be available 5-10 minutes before the scheduled time</li>
                <li>Check your internet connection (if online)</li>
                <li>Have your resume and relevant documents ready</li>
              </ul>

              <p>We look forward to speaking with you!</p>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>Best regards,<br><strong>${companyName}</strong> Recruitment Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@airecruiter.com',
      to: candidateEmail,
      subject: `Reminder: Interview Tomorrow for ${jobTitle}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Interview reminder email sent to ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error('Error sending interview reminder email:', err);
    throw err;
  }
};

/**
 * Send interview cancellation email to candidate
 */
export const sendInterviewCancellationEmail = async (interviewDetails) => {
  try {
    const {
      candidateEmail,
      candidateName,
      recruiterName,
      companyName,
      jobTitle,
      interviewDate,
      interviewTime,
      rescheduleReason
    } = interviewDetails;

    const dateObj = new Date(interviewDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Rescheduled</h1>
            </div>
            <div class="content">
              <p>Hi ${candidateName},</p>
              
              <p>We regret to inform you that your interview scheduled for <strong>${formattedDate} at ${interviewTime}</strong> has been rescheduled.</p>

              <p><strong>Reason:</strong> ${rescheduleReason || 'Due to unforeseen circumstances'}</p>

              <p>We sincerely apologize for any inconvenience this may cause. Our recruitment team will be in touch shortly to reschedule your interview.</p>

              <p>If you have any questions or concerns, please don't hesitate to contact us.</p>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>Best regards,<br><strong>${companyName}</strong> Recruitment Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@airecruiter.com',
      to: candidateEmail,
      subject: `Interview Rescheduled - ${jobTitle} at ${companyName}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Interview cancellation email sent to ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error('Error sending interview cancellation email:', err);
    throw err;
  }
};

/**
 * Send new message notification email
 */
export const sendNewMessageNotificationEmail = async (messageDetails) => {
  try {
    const {
      recipientEmail,
      recipientName,
      senderName,
      companyName,
      jobTitle,
      messagePreview
    } = messageDetails;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; font-size: 20px; }
            .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .message-preview { background: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Message from ${senderName}</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <p>You have received a new message regarding the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>

              <div class="message-preview">
                <strong>${senderName}:</strong><br>
                ${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}
              </div>

              <p>Log in to your dashboard to view the full conversation and reply.</p>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>Best regards,<br><strong>${companyName}</strong> Recruitment Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@airecruiter.com',
      to: recipientEmail,
      subject: `New Message from ${senderName} - ${jobTitle}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`New message notification sent to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error('Error sending message notification email:', err);
    // Don't throw - notifications shouldn't break the app
    return false;
  }
};

/**
 * Send welcome/onboarding email
 */
export const sendWelcomeEmail = async (userDetails) => {
  try {
    const { email, name, role, companyName } = userDetails;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .header h1 { margin: 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
            ul { margin: 15px 0; padding-left: 20px; }
            li { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AI Recruiter! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for joining our AI Recruiter platform! We're excited to have you on board.</p>

              ${role === 'recruiter' ? `
                <h3>What you can do as a Recruiter:</h3>
                <ul>
                  <li>Post and manage job openings</li>
                  <li>Review candidate applications and resumes</li>
                  <li>Create and assign tests to candidates</li>
                  <li>Schedule interviews directly with candidates</li>
                  <li>Chat with candidates in real-time</li>
                  <li>View analytics and candidate metrics</li>
                </ul>
              ` : `
                <h3>What you can do as a Candidate:</h3>
                <ul>
                  <li>Browse and apply for job openings</li>
                  <li>Upload and manage your resume</li>
                  <li>Take tests assigned by recruiters</li>
                  <li>View scheduled interviews</li>
                  <li>Chat with recruiters about positions</li>
                  <li>Track your application status</li>
                </ul>
              `}

              <p>If you have any questions or need assistance, our support team is here to help!</p>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>Best regards,<br>The AI Recruiter Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@airecruiter.com',
      to: email,
      subject: `Welcome to AI Recruiter, ${name}!`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return false;
  }
};

export default {
  sendInterviewScheduledEmail,
  sendInterviewReminderEmail,
  sendInterviewCancellationEmail,
  sendNewMessageNotificationEmail,
  sendWelcomeEmail
};
