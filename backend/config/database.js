import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.set('autoIndex', true);
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
