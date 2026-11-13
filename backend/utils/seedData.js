import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import connectDB from '../config/db.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    await connectDB();

    console.log('[CleanDB] Resetting database collections...');
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await Company.deleteMany();
    await PlacementDrive.deleteMany();
    await Application.deleteMany();

    console.log('[CleanDB] Database cleared. Real accounts must be registered via the portal.');
    process.exit(0);
  } catch (error) {
    console.error('[CleanDB Error]', error);
    process.exit(1);
  }
};

clearDatabase();
