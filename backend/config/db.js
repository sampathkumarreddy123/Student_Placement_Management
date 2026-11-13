import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_portal';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    console.log(
      '[Database Tip] Ensure MongoDB is running locally (e.g., mongod or MongoDB Compass) or update MONGODB_URI in backend/.env to your MongoDB Atlas connection string.'
    );
  }
};

export default connectDB;
