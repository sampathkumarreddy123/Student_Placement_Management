import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';

async function setupStudentQuestions() {
  await connectDB();
  const email = '25695a0111@mits.ac.in';
  const user = await User.findOne({ email }).select('+securityQuestions');
  
  if (!user) {
    console.log(`User ${email} not found.`);
    await mongoose.disconnect();
    return;
  }

  const defaultQuestions = [
    {
      question: 'What was the name of your first school?',
      answer: 'mits',
    },
    {
      question: 'What was your childhood nickname?',
      answer: 'sam',
    },
    {
      question: 'What is the name of your favourite teacher?',
      answer: 'rao',
    },
  ];

  await user.setSecurityQuestions(defaultQuestions);
  await user.save({ validateBeforeSave: false });

  console.log(`✅ Security questions configured successfully for ${email}!`);
  console.log('Questions configured:');
  defaultQuestions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question} (Answer: ${q.answer})`);
  });

  await mongoose.disconnect();
}

setupStudentQuestions().catch(console.error);
