import mongoose from 'mongoose';

// Establish the shared MongoDB connection used by all Mongoose models.
export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to Server');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
}
