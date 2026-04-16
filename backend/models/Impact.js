import mongoose from 'mongoose';

const impactSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  mealsSaved: {
    type: Number,
    default: 0
  },
  co2Avoided: {
    type: Number,
    default: 0
  },
  activeDonors: {
    type: Number,
    default: 0
  },
  activeReceivers: {
    type: Number,
    default: 0
  },
  listingsCreated: {
    type: Number,
    default: 0
  },
  listingsClaimed: {
    type: Number,
    default: 0
  },
  listingsCompleted: {
    type: Number,
    default: 0
  },
  listingsExpired: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index
impactSchema.index({ date: -1 });

const Impact = mongoose.model('Impact', impactSchema);

export default Impact;
