import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
export const sendSMS = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log('SMS sent successfully');
  } catch (error) {
    console.error('SMS error:', error);
  }
};

// SMS templates
export const smsTemplates = {
  listingClaimed: (foodTitle, receiverName) => 
    `Food Surplus: ${receiverName} claimed your "${foodTitle}". Check the app for pickup details.`,
  
  listingExpired: (foodTitle) => 
    `Food Surplus: Your listing "${foodTitle}" has expired.`,
  
  newListingNearby: (foodTitle, distance) => 
    `Food Surplus: New listing "${foodTitle}" available ${distance}km away. Claim now!`
};
