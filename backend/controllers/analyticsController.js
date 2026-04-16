import Impact from '../models/Impact.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get global impact statistics
// @route   GET /api/analytics/impact
// @access  Public
export const getImpactStats = asyncHandler(async (req, res) => {
  // Get all-time stats from users
  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalMealsDonated: { $sum: '$stats.mealsDonated' },
        totalMealsReceived: { $sum: '$stats.mealsReceived' },
        totalCO2Avoided: { $sum: '$stats.co2Avoided' }
      }
    }
  ]);

  // Count active users
  const activeDonors = await User.countDocuments({ role: 'donor' });
  const activeReceivers = await User.countDocuments({ role: { $in: ['receiver', 'ngo'] } });

  // Get listing stats
  const listingStats = await Listing.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = userStats[0] || {
    totalMealsDonated: 0,
    totalMealsReceived: 0,
    totalCO2Avoided: 0
  };

  res.json({
    success: true,
    data: {
      mealsSaved: stats.totalMealsDonated,
      foodDistributed: Math.round(stats.totalMealsDonated * 0.3), // Rough estimate: 0.3kg per meal
      co2Avoided: stats.totalCO2Avoided,
      activeDonors,
      activeReceivers,
      listingStats
    }
  });
});

// @desc    Get time-series trends
// @route   GET /api/analytics/trends
// @access  Private (Admin)
export const getTrends = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = {};
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const trends = await Impact.find(query).sort({ date: -1 }).limit(30);

  res.json({
    success: true,
    data: trends
  });
});

// @desc    Get donor-specific stats
// @route   GET /api/analytics/donor/:id/stats
// @access  Private
export const getDonorStats = asyncHandler(async (req, res) => {
  const donor = await User.findById(req.params.id);

  if (!donor) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Donor not found',
        code: 'NOT_FOUND'
      }
    });
  }

  const listings = await Listing.find({ donor: req.params.id });
  const activeListings = listings.filter(l => l.status === 'active').length;
  const completedListings = listings.filter(l => l.status === 'completed').length;

  res.json({
    success: true,
    data: {
      ...donor.stats,
      totalListings: listings.length,
      activeListings,
      completedListings
    }
  });
});

// @desc    Get receiver-specific stats
// @route   GET /api/analytics/receiver/:id/stats
// @access  Private
export const getReceiverStats = asyncHandler(async (req, res) => {
  const receiver = await User.findById(req.params.id);

  if (!receiver) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Receiver not found',
        code: 'NOT_FOUND'
      }
    });
  }

  const claimedListings = await Listing.find({ claimedBy: req.params.id });
  const activeListings = claimedListings.filter(l => l.status === 'claimed').length;
  const completedListings = claimedListings.filter(l => l.status === 'completed').length;

  res.json({
    success: true,
    data: {
      ...receiver.stats,
      totalClaims: claimedListings.length,
      activeClaims: activeListings,
      completedClaims: completedListings
    }
  });
});
