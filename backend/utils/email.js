import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name) => `
    <h1>Welcome to Food Surplus!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for joining our platform to reduce food waste and help those in need.</p>
    <p>Start making a difference today!</p>
  `,
  
  listingClaimed: (donorName, receiverName, foodTitle) => `
    <h1>Your listing has been claimed!</h1>
    <p>Hi ${donorName},</p>
    <p>${receiverName} has claimed your listing: <strong>${foodTitle}</strong></p>
    <p>Please coordinate the pickup through the chat feature.</p>
  `,
  
  listingExpired: (donorName, foodTitle) => `
    <h1>Listing Expired</h1>
    <p>Hi ${donorName},</p>
    <p>Your listing "<strong>${foodTitle}</strong>" has expired.</p>
    <p>Consider posting again if you have more surplus food!</p>
  `
};
