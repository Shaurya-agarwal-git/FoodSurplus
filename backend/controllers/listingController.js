import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadImageFromBuffer } from '../utils/imageUpload.js';
import { analyzeFoodImage } from '../utils/foodAnalysis.js';

export const analyzeImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'Please upload an image', code: 'NO_IMAGE' } });
  }

  const imageUrl = await uploadImageFromBuffer(req.file.buffer, 'food-surplus/listings');
  const analysis = await analyzeFoodImage(imageUrl);

  res.json({ success: true, data: { imageUrl, analysis } });
});

export const createListing = asyncHandler(async (req, res) => {
  const listing = await Listing.create({ donor: req.user.id, ...req.body });
  await listing.populate('donor', 'name phone');
  res.status(201).json({ success: true, data: listing });
});

export const getListings = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10, dietaryTags, status = 'active' } = req.query;

  const query = { status };
  if (dietaryTags) query.dietaryTags = { $in: dietaryTags.split(',') };

  let listings;

  if (latitude && longitude) {
    listings = await Listing.find({
      ...query,
      pickupLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: radius * 1000
        }
      }
    }).populate('donor', 'name phone').sort({ createdAt: -1 }).limit(50);
  } else {
    listings = await Listing.find(query).populate('donor', 'name phone').sort({ createdAt: -1 }).limit(50);
  }

  res.json({ success: true, count: listings.length, data: listings });
});

export const getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('donor', 'name phone location')
    .populate('claimedBy', 'name phone');

  if (!listing) {
    return res.status(404).json({ success: false, error: { message: 'Listing not found', code: 'NOT_FOUND' } });
  }

  res.json({ success: true, data: listing });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return res.status(404).json({ success: false, error: { message: 'Listing not found', code: 'NOT_FOUND' } });
  }

  if (listing.donor.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Not authorized', code: 'FORBIDDEN' } });
  }

  const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
});

export const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return res.status(404).json({ success: false, error: { message: 'Listing not found', code: 'NOT_FOUND' } });
  }

  if (listing.donor.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Not authorized', code: 'FORBIDDEN' } });
  }

  await listing.deleteOne();
  res.json({ success: true, data: {} });
});

export const claimListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return res.status(404).json({ success: false, error: { message: 'Listing not found', code: 'NOT_FOUND' } });
  }

  if (listing.status !== 'active') {
    return res.status(400).json({ success: false, error: { message: 'Listing is not available', code: 'NOT_AVAILABLE' } });
  }

  listing.status = 'claimed';
  listing.claimedBy = req.user.id;
  listing.claimedAt = Date.now();
  await listing.save();

  const chat = await Chat.create({ listing: listing._id, participants: [listing.donor, req.user.id], messages: [] });

  await listing.populate('donor', 'name phone');
  await listing.populate('claimedBy', 'name phone');

  res.json({ success: true, data: { listing, chatId: chat._id } });
});

export const completeListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return res.status(404).json({ success: false, error: { message: 'Listing not found', code: 'NOT_FOUND' } });
  }

  if (listing.donor.toString() !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Not authorized', code: 'FORBIDDEN' } });
  }

  listing.status = 'completed';
  listing.completedAt = Date.now();
  await listing.save();

  const portions = parseInt(listing.quantity.match(/\d+/)?.[0] || 10);
  const co2Saved = portions * 0.5;

  await User.findByIdAndUpdate(listing.donor, { $inc: { 'stats.mealsDonated': portions, 'stats.co2Avoided': co2Saved } });
  await User.findByIdAndUpdate(listing.claimedBy, { $inc: { 'stats.mealsReceived': portions } });

  res.json({ success: true, data: listing });
});
