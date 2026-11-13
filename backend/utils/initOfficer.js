import User from '../models/User.js';

/**
 * Ensures at least one Placement Officer exists in the system
 * using environment variables (securely provisioned, no public registration).
 */
export const ensureOfficerAccount = async () => {
  try {
    const officerEmail = (
      process.env.DEFAULT_OFFICER_EMAIL || 'officer@college.edu'
    )
      .toLowerCase()
      .trim();

    const existing = await User.findOne({ email: officerEmail });

    if (!existing) {
      await User.create({
        name:
          process.env.DEFAULT_OFFICER_NAME || 'Dr. Anita Sharma (Placement Head)',
        email: officerEmail,
        password: process.env.DEFAULT_OFFICER_PASSWORD || 'password123',
        role: 'officer',
      });
      console.log(
        `[Auth Init] Provisioned initial Placement Officer account: ${officerEmail}`
      );
    }
  } catch (error) {
    console.error(`[Auth Init Error] Failed to ensure officer account: ${error.message}`);
  }
};

