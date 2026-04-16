import cron from 'node-cron';
import Listing from '../models/Listing.js';
import Impact from '../models/Impact.js';
import User from '../models/User.js';
import { sendEmail, emailTemplates } from './email.js';
import { sendSMS, smsTemplates } from './sms.js';

export const expireListingsJob = cron.schedule('*/5 * * * *', async () => {
  try {
    const expired = await Listing.find({ status: 'active', expiryTime: { $lt: new Date() } }).populate('donor', 'name email phone');

    for (const listing of expired) {
      listing.status = 'expired';
      await listing.save();

      if (listing.donor.email) {
        await sendEmail({ to: listing.donor.email, subject: 'Food Surplus - Listing Expired', html: emailTemplates.listingExpired(listing.donor.name, listing.title) });
      }
      if (listing.donor.phone) {
        await sendSMS(listing.donor.phone, smsTemplates.listingExpired(listing.title));
      }
    }
  } catch (error) {
    console.error('Expiry job error:', error);
  }
});

export const markExpiringSoonJob = cron.schedule('*/5 * * * *', async () => {
  try {
    const thirtyMins = new Date(Date.now() + 30 * 60 * 1000);
    await Listing.countDocuments({ status: 'active', expiryTime: { $lt: thirtyMins, $gt: new Date() } });
  } catch (error) {
    console.error('Expiring soon job error:', error);
  }
});

export const aggregateImpactJob = cron.schedule('0 * * * *', async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [listingsCreated, listingsClaimed, listingsCompleted, listingsExpired, completedToday] = await Promise.all([
      Listing.countDocuments({ createdAt: { $gte: today } }),
      Listing.countDocuments({ claimedAt: { $gte: today } }),
      Listing.countDocuments({ completedAt: { $gte: today } }),
      Listing.countDocuments({ status: 'expired', updatedAt: { $gte: today } }),
      Listing.find({ completedAt: { $gte: today } })
    ]);

    let mealsSaved = 0;
    let co2Avoided = 0;

    completedToday.forEach(l => {
      const portions = parseInt(l.quantity.match(/\d+/)?.[0] || 10);
      mealsSaved += portions;
      co2Avoided += portions * 0.5;
    });

    const [activeDonors, activeReceivers] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: { $in: ['receiver', 'ngo'] } })
    ]);

    await Impact.findOneAndUpdate(
      { date: today },
      { mealsSaved, co2Avoided, activeDonors, activeReceivers, listingsCreated, listingsClaimed, listingsCompleted, listingsExpired },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Impact aggregation error:', error);
  }
});

export const startCronJobs = () => {
  expireListingsJob.start();
  markExpiringSoonJob.start();
  aggregateImpactJob.start();
};
