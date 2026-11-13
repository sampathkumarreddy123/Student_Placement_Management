import User from '../models/User.js';

/**
 * Ensures a Placement Officer exists in the system ONLY if credentials
 * are explicitly provisioned via environment variables (no hardcoded/default passwords).
 */
export const ensureOfficerAccount = async () => {
  try {
    const officerEmail = (process.env.OFFICER_EMAIL || process.env.DEFAULT_OFFICER_EMAIL || '')
      .toLowerCase()
      .trim();
    const officerPassword = process.env.OFFICER_PASSWORD || process.env.DEFAULT_OFFICER_PASSWORD;

    // Do not create default account if no explicit password/email is configured in environment
    if (!officerEmail || !officerPassword) {
      return;
    }

    const existing = await User.findOne({ email: officerEmail });

    if (!existing) {
      await User.create({
        name: process.env.OFFICER_NAME || process.env.DEFAULT_OFFICER_NAME || 'Placement Officer',
        email: officerEmail,
        password: officerPassword,
        role: 'officer',
      });
      console.log(
        `[Auth Init] Securely provisioned configured Placement Officer account: ${officerEmail}`
      );
    }
  } catch (error) {
    console.error(`[Auth Init Error] Failed to ensure officer account: ${error.message}`);
  }
};


