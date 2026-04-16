import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, trim: true },
  foodType: { type: String, required: true },
  quantity: { type: String, required: true },
  dietaryTags: [{ type: String, enum: ['veg', 'non-veg', 'vegan', 'gluten-free', 'dairy-free'] }],
  imageUrl: { type: String, required: true },
  aiAnalysis: {
    foodType: String,
    quantity: String,
    dietaryTags: [String],
    confidence: Number,
    suggestedExpiry: Date
  },
  pickupLocation: {
    address: { type: String, required: true },
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], required: true }
  },
  pickupRadius: { type: Number, default: 5, min: 1, max: 50 },
  expiryTime: { type: Date, required: true },
  status: { type: String, enum: ['active', 'claimed', 'completed', 'expired'], default: 'active' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedAt: Date,
  completedAt: Date
}, { timestamps: true });

listingSchema.index({ pickupLocation: '2dsphere' });
listingSchema.index({ donor: 1, status: 1 });
listingSchema.index({ status: 1, expiryTime: 1 });
listingSchema.index({ createdAt: -1 });

listingSchema.virtual('isExpiringSoon').get(function () {
  return this.expiryTime - Date.now() < 30 * 60 * 1000 && this.status === 'active';
});

export default mongoose.model('Listing', listingSchema);
