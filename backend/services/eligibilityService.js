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

  // 1. Drive status checks
  if (drive.status === 'Draft') {
    reasons.push('Drive is currently in Draft mode and not yet open for applications.');
  }

  if (drive.status === 'Closed' || drive.status === 'Completed' || drive.status === 'Cancelled') {
    reasons.push(`Drive status is "${drive.status}". Applications are closed.`);
  }

  // 2. Deadline check
  const now = new Date();
  const closingDate = drive.applicationClosingDate || drive.registrationDeadline;
  if (closingDate && new Date(closingDate) < now) {
    reasons.push('Application deadline for this drive has expired.');
  }

  // Opening date check
  if (drive.applicationOpeningDate && new Date(drive.applicationOpeningDate) > now) {
    reasons.push(
      `Applications for this drive will open on ${new Date(drive.applicationOpeningDate).toLocaleDateString()}.`
    );
  }

  // 3. CGPA check
  if (eligibilityCriteria?.minCgpa !== undefined && profile.cgpa < eligibilityCriteria.minCgpa) {
    reasons.push(
      `Minimum CGPA required is ${eligibilityCriteria.minCgpa.toFixed(2)}, but your CGPA is ${profile.cgpa.toFixed(2)}.`
    );
  }

  // 4. Active Backlogs check
  const maxActive =
    eligibilityCriteria?.maxActiveBacklogs !== undefined
      ? eligibilityCriteria.maxActiveBacklogs
      : eligibilityCriteria?.maxBacklogs !== undefined
      ? eligibilityCriteria.maxBacklogs
      : 0;

  const studentActiveBacklogs =
    profile.activeBacklogs !== undefined ? profile.activeBacklogs : profile.backlogs || 0;

  if (studentActiveBacklogs > maxActive) {
    reasons.push(
      `Maximum allowed active backlogs is ${maxActive}, but you currently have ${studentActiveBacklogs}.`
    );
  }

  // 5. Total Backlogs check
  if (eligibilityCriteria?.maxTotalBacklogs !== undefined) {
    const studentTotal = profile.totalBacklogs || 0;
    if (studentTotal > eligibilityCriteria.maxTotalBacklogs) {
      reasons.push(
        `Maximum total historical backlogs allowed is ${eligibilityCriteria.maxTotalBacklogs}, but you have ${studentTotal}.`
      );
    }
  }

  // 6. Allowed departments check
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
        `Your department (${profile.department}) is not in the allowed list: ${eligibilityCriteria.allowedDepartments.join(', ')}.`
      );
    }
  }

  // 7. Graduation Batch check
  if (eligibilityCriteria?.batch && profile.batch && profile.batch !== eligibilityCriteria.batch) {
    reasons.push(
      `Drive is open for Class of ${eligibilityCriteria.batch}, but your batch year is ${profile.batch}.`
    );
  }

  // 8. 10th & 12th percentage checks
  if (
    eligibilityCriteria?.minTenthPercentage &&
    profile.tenthPercentage &&
    profile.tenthPercentage < eligibilityCriteria.minTenthPercentage
  ) {
    reasons.push(
      `Minimum 10th grade score required is ${eligibilityCriteria.minTenthPercentage}%. Your score: ${profile.tenthPercentage}%.`
    );
  }

  if (
    eligibilityCriteria?.minTwelfthPercentage &&
    profile.twelfthPercentage &&
    profile.twelfthPercentage < eligibilityCriteria.minTwelfthPercentage
  ) {
    reasons.push(
      `Minimum 12th/Diploma score required is ${eligibilityCriteria.minTwelfthPercentage}%. Your score: ${profile.twelfthPercentage}%.`
    );
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};
