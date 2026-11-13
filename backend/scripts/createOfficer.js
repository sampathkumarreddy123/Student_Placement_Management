import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const createOfficer = async () => {
  const args = process.argv.slice(2);
  const name = args[0] || process.env.OFFICER_NAME || 'Placement Officer';
  const email = (args[1] || process.env.OFFICER_EMAIL || '').toLowerCase().trim();
  const password = args[2] || process.env.OFFICER_PASSWORD || '';

  if (!email || !password) {
    console.error('Usage: node scripts/createOfficer.js "<Full Name>" "<Email>" "<Password>"');
    console.error('Example: node scripts/createOfficer.js "Prof. Sharma" "sharma@college.edu" "SuperSecret987"');
    process.exit(1);
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'officer') {
        console.log(`Officer account already exists for ${email}. Updating details...`);
        existing.name = name;
        existing.password = password; // Will be hashed by pre-save
        await existing.save();
        console.log(`Successfully updated officer password for ${email}!`);
      } else {
        console.error(`Cannot create officer: ${email} is already registered as a student.`);
        process.exit(1);
      }
    } else {
      await User.create({
        name,
        email,
        password,
        role: 'officer',
      });
      console.log(`🎉 Successfully created Placement Officer account for ${name} (${email})!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating officer account:', error.message);
    process.exit(1);
  }
};

createOfficer();

