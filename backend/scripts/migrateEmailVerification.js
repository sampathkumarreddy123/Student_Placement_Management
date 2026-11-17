import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://sampathkumarreddy:sampath317.@cluster0.irpbz.mongodb.net/placement_portal?retryWrites=true&w=majority';

async function migrate() {
  console.log('[Migration] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[Migration] Connected.');

  const db = mongoose.connection.db;
  const userCol = db.collection('users');

  const result = await userCol.updateMany(
    {},
    {
      $set: { isEmailVerified: true },
      $unset: {
        emailVerificationToken: '',
        emailVerificationExpire: '',
      },
    }
  );

  console.log(`[Migration] Updated ${result.modifiedCount} users to isEmailVerified = true.`);

  // Verify
  const unverifiedCount = await userCol.countDocuments({ isEmailVerified: { $ne: true } });
  console.log(`[Migration] Remaining unverified users: ${unverifiedCount}`);

  await mongoose.disconnect();
  console.log('[Migration] Finished successfully.');
}

migrate().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
