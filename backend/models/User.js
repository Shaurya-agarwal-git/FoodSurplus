import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['donor', 'receiver', 'ngo', 'admin'], required: true },
  name: { type: String, required: [true, 'Name is required'], trim: true },
  phone: { type: String, required: [true, 'Phone number is required'] },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], default: [0, 0] }
  },
  verified: { type: Boolean, default: false },
  ngoDetails: {
    organizationName: String,
    registrationNumber: String,
    documents: [String]
  },
  stats: {
    mealsDonated: { type: Number, default: 0 },
    mealsReceived: { type: Number, default: 0 },
    co2Avoided: { type: Number, default: 0 }
  }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
