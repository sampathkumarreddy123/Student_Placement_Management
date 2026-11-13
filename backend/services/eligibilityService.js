/**
 * Evaluates whether a student meets the criteria for a placement drive
 * @param {Object} profile - StudentProfile document or object
 * @param {Object} drive - PlacementDrive document or object
 * @returns {{ isEligible: boolean, reasons: string[] }}
 */
export const checkEligibility = (profile, drive) => {
  const reasons = [];

  if (!profile) {
    return {
      isEligible: false,
      reasons: ['Complete your student profile before applying to placement drives.'],
    };
  }

  const { eligibilityCriteria } = drive;

  // 1. Deadline check
  const now = new Date();
  if (drive.registrationDeadline && new Date(drive.registrationDeadline) < now) {
    reasons.push('Registration deadline for this drive has passed.');
  }

  // 2. Drive status
  if (drive.status === 'Completed' || drive.status === 'Cancelled') {
    reasons.push(`Drive is currently ${drive.status.toLowerCase()}. Applications are closed.`);
  }

  // 3. CGPA check
  if (eligibilityCriteria?.minCgpa !== undefined && profile.cgpa < eligibilityCriteria.minCgpa) {
    reasons.push(
      `Minimum CGPA required is ${eligibilityCriteria.minCgpa}, but your CGPA is ${profile.cgpa.toFixed(2)}.`
    );
  }

  // 4. Backlogs check
  if (
    eligibilityCriteria?.maxBacklogs !== undefined &&
    profile.backlogs > eligibilityCriteria.maxBacklogs
  ) {
    reasons.push(
      `Maximum allowed active backlogs is ${eligibilityCriteria.maxBacklogs}, but you have ${profile.backlogs}.`
    );
  }

  // 5. Allowed departments check
  if (
    Array.isArray(eligibilityCriteria?.allowedDepartments) &&
    eligibilityCriteria.allowedDepartments.length > 0
  ) {
    const studentDept = (profile.department || '').trim().toLowerCase();
    const isAllowed = eligibilityCriteria.allowedDepartments.some(
      (dept) => dept.trim().toLowerCase() === studentDept
    );

    if (!isAllowed) {
      reasons.push(
        `Your department (${profile.department}) is not in the eligible list: ${eligibilityCriteria.allowedDepartments.join(', ')}.`
      );
    }
  }

  // 6. Batch check
  if (eligibilityCriteria?.batch && profile.batch && profile.batch !== eligibilityCriteria.batch) {
    reasons.push(
      `Drive is open for batch ${eligibilityCriteria.batch}, but your batch is ${profile.batch}.`
    );
  }

  // 7. 10th & 12th percentage checks
  if (
    eligibilityCriteria?.minTenthPercentage &&
    profile.tenthPercentage &&
    profile.tenthPercentage < eligibilityCriteria.minTenthPercentage
  ) {
    reasons.push(
      `Minimum 10th grade marks required: ${eligibilityCriteria.minTenthPercentage}%. Your score: ${profile.tenthPercentage}%.`
    );
  }

  if (
    eligibilityCriteria?.minTwelfthPercentage &&
    profile.twelfthPercentage &&
    profile.twelfthPercentage < eligibilityCriteria.minTwelfthPercentage
  ) {
    reasons.push(
      `Minimum 12th grade marks required: ${eligibilityCriteria.minTwelfthPercentage}%. Your score: ${profile.twelfthPercentage}%.`
    );
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};

