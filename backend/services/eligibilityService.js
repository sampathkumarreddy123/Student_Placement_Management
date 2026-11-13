/**
 * Department Acronym Normalizer
 * Maps common acronyms (e.g. CSE, IT, ECE) and full names to standard forms
 */
const normalizeDepartment = (dept) => {
  if (!dept) return '';
  const d = dept.trim().toLowerCase();
  if (d === 'cse' || d.includes('computer science')) return 'computer science';
  if (d === 'it' || d.includes('information technology')) return 'information technology';
  if (d === 'ece' || d.includes('electronics & communication') || d.includes('electronics and communication')) {
    return 'electronics & communication';
  }
  if (d === 'eee' || d.includes('electrical engineering') || d.includes('electrical & electronics')) {
    return 'electrical engineering';
  }
  if (d === 'mech' || d.includes('mechanical engineering') || d === 'me') return 'mechanical engineering';
  if (d === 'civil' || d.includes('civil engineering') || d === 'ce') return 'civil engineering';
  return d;
};

/**
 * Checks if student's department is in the allowed list
 */
const isDepartmentAllowed = (studentDept, allowedList) => {
  if (!Array.isArray(allowedList) || allowedList.length === 0) return true;
  if (!studentDept) return false;

  const normalizedStudent = normalizeDepartment(studentDept);
  return allowedList.some((allowed) => {
    const normalizedAllowed = normalizeDepartment(allowed);
    return normalizedStudent === normalizedAllowed || studentDept.trim().toLowerCase() === allowed.trim().toLowerCase();
  });
};

/**
 * Evaluates whether a student meets the criteria for a placement drive
 * Checks all 7 conditions:
 * 1. Minimum CGPA
 * 2. Minimum 10th percentage
 * 3. Minimum Intermediate / Diploma percentage
 * 4. Allowed department
 * 5. Graduation year
 * 6. Maximum active backlogs
 * 7. Maximum total backlogs
 *
 * @param {Object} profile - StudentProfile document or object
 * @param {Object} drive - PlacementDrive document or object
 * @returns {Object} Detailed evaluation result
 */
export const checkEligibility = (profile, drive) => {
  const criteriaDetails = [];
  const reasons = [];
  const missingProfileFields = [];

  // Check if profile is missing entirely
  if (!profile) {
    return {
      isEligible: false,
      hasIncompleteProfile: true,
      missingProfileFields: ['Complete Student Academic Profile'],
      summary: 'Student profile not found. Please complete your profile to check eligibility.',
      criteriaDetails: [],
      reasons: ['Please complete your academic profile before applying to placement drives.'],
    };
  }

  // Normalize student profile academic fields (supporting both flat MongoDB model and nested schemas)
  const studentCgpa =
    profile.cgpa !== undefined && profile.cgpa !== null
      ? Number(profile.cgpa)
      : profile.academics?.currentCgpa !== undefined && profile.academics?.currentCgpa !== null
      ? Number(profile.academics.currentCgpa)
      : 0;

  const studentDept = profile.department || profile.academics?.department || '';
  const studentBatch =
    profile.batch !== undefined && profile.batch !== null
      ? Number(profile.batch)
      : profile.academics?.graduationYear !== undefined && profile.academics?.graduationYear !== null
      ? Number(profile.academics.graduationYear)
      : null;

  const studentTenth =
    profile.tenthPercentage !== undefined && profile.tenthPercentage !== null
      ? Number(profile.tenthPercentage)
      : profile.academics?.tenthPercentage !== undefined && profile.academics?.tenthPercentage !== null
      ? Number(profile.academics.tenthPercentage)
      : 0;

  const studentTwelfth =
    profile.twelfthPercentage !== undefined && profile.twelfthPercentage !== null
      ? Number(profile.twelfthPercentage)
      : profile.academics?.intermediatePercentage !== undefined && profile.academics?.intermediatePercentage !== null
      ? Number(profile.academics.intermediatePercentage)
      : 0;

  const studentActiveBacklogs =
    profile.activeBacklogs !== undefined && profile.activeBacklogs !== null
      ? Number(profile.activeBacklogs)
      : profile.academics?.activeBacklogs !== undefined && profile.academics?.activeBacklogs !== null
      ? Number(profile.academics.activeBacklogs)
      : profile.backlogs !== undefined && profile.backlogs !== null
      ? Number(profile.backlogs)
      : 0;

  const studentTotalBacklogs =
    profile.totalBacklogs !== undefined && profile.totalBacklogs !== null
      ? Number(profile.totalBacklogs)
      : profile.academics?.totalBacklogs !== undefined && profile.academics?.totalBacklogs !== null
      ? Number(profile.academics.totalBacklogs)
      : studentActiveBacklogs;

  // Check for incomplete profile fields
  if (studentCgpa <= 0) {
    missingProfileFields.push('CGPA');
  }
  if (!studentDept) {
    missingProfileFields.push('Department / Branch');
  }
  if (!studentBatch) {
    missingProfileFields.push('Graduation Year / Batch');
  }
  if (studentTenth <= 0) {
    missingProfileFields.push('10th Standard Percentage');
  }
  if (studentTwelfth <= 0) {
    missingProfileFields.push('12th / Intermediate / Diploma Percentage');
  }

  const { eligibilityCriteria } = drive || {};

  // ==========================================
  // CONDITION 1: MINIMUM CGPA
  // ==========================================
  const minCgpa = eligibilityCriteria?.minCgpa !== undefined ? Number(eligibilityCriteria.minCgpa) : 0;
  const cgpaPass = studentCgpa >= minCgpa;

  criteriaDetails.push({
    conditionNumber: 1,
    criterion: 'Minimum CGPA',
    required: minCgpa > 0 ? `${minCgpa.toFixed(2)} / 10.0` : 'No cutoff',
    actual: `${studentCgpa.toFixed(2)} / 10.0`,
    status: cgpaPass ? 'PASS' : 'FAIL',
    reason: cgpaPass
      ? `Your CGPA (${studentCgpa.toFixed(2)}) meets the minimum requirement of ${minCgpa.toFixed(2)}.`
      : `Your CGPA is ${studentCgpa.toFixed(2)}, which is below the required cutoff of ${minCgpa.toFixed(2)}.`,
  });

  if (!cgpaPass) {
    reasons.push(`Minimum CGPA required is ${minCgpa.toFixed(2)}, but your CGPA is ${studentCgpa.toFixed(2)}.`);
  }

  // ==========================================
  // CONDITION 2: MINIMUM 10TH PERCENTAGE
  // ==========================================
  const minTenth = eligibilityCriteria?.minTenthPercentage !== undefined ? Number(eligibilityCriteria.minTenthPercentage) : 0;
  const tenthPass = minTenth === 0 || studentTenth >= minTenth;

  criteriaDetails.push({
    conditionNumber: 2,
    criterion: 'Minimum 10th Percentage',
    required: minTenth > 0 ? `${minTenth}%` : 'No cutoff',
    actual: studentTenth > 0 ? `${studentTenth}%` : 'Not provided',
    status: tenthPass ? 'PASS' : 'FAIL',
    reason: tenthPass
      ? `Your 10th percentage (${studentTenth}%) satisfies the requirement of ${minTenth}%.`
      : `Your 10th grade score (${studentTenth}%) is below the minimum required ${minTenth}%.`,
  });

  if (!tenthPass) {
    reasons.push(`Minimum 10th percentage required is ${minTenth}%, but your score is ${studentTenth}%.`);
  }

  // ==========================================
  // CONDITION 3: MINIMUM INTERMEDIATE / DIPLOMA PERCENTAGE
  // ==========================================
  const minTwelfth =
    eligibilityCriteria?.minTwelfthPercentage !== undefined
      ? Number(eligibilityCriteria.minTwelfthPercentage)
      : eligibilityCriteria?.minIntermediatePercentage !== undefined
      ? Number(eligibilityCriteria.minIntermediatePercentage)
      : 0;
  const twelfthPass = minTwelfth === 0 || studentTwelfth >= minTwelfth;

  criteriaDetails.push({
    conditionNumber: 3,
    criterion: 'Minimum Intermediate / Diploma %',
    required: minTwelfth > 0 ? `${minTwelfth}%` : 'No cutoff',
    actual: studentTwelfth > 0 ? `${studentTwelfth}%` : 'Not provided',
    status: twelfthPass ? 'PASS' : 'FAIL',
    reason: twelfthPass
      ? `Your 12th/Diploma percentage (${studentTwelfth}%) satisfies the requirement of ${minTwelfth}%.`
      : `Your Intermediate/Diploma score (${studentTwelfth}%) is below the minimum required ${minTwelfth}%.`,
  });

  if (!twelfthPass) {
    reasons.push(`Minimum Intermediate/Diploma score required is ${minTwelfth}%, but your score is ${studentTwelfth}%.`);
  }

  // ==========================================
  // CONDITION 4: ALLOWED DEPARTMENT
  // ==========================================
  const allowedDepts = eligibilityCriteria?.allowedDepartments || [];
  const deptPass = allowedDepts.length === 0 || isDepartmentAllowed(studentDept, allowedDepts);

  criteriaDetails.push({
    conditionNumber: 4,
    criterion: 'Allowed Department',
    required: allowedDepts.length > 0 ? allowedDepts.join(', ') : 'All Departments',
    actual: studentDept || 'Not specified',
    status: deptPass ? 'PASS' : 'FAIL',
    reason: deptPass
      ? `Your department (${studentDept}) is eligible for this drive.`
      : `Your department (${studentDept}) is not among the eligible departments for this drive.`,
  });

  if (!deptPass) {
    reasons.push(`Department "${studentDept}" is not in the allowed list: ${allowedDepts.join(', ')}.`);
  }

  // ==========================================
  // CONDITION 5: GRADUATION YEAR
  // ==========================================
  const requiredBatch =
    eligibilityCriteria?.batch !== undefined && eligibilityCriteria.batch !== null
      ? Number(eligibilityCriteria.batch)
      : eligibilityCriteria?.graduationYear !== undefined && eligibilityCriteria.graduationYear !== null
      ? Number(eligibilityCriteria.graduationYear)
      : null;
  const batchPass = !requiredBatch || !studentBatch || studentBatch === requiredBatch;

  criteriaDetails.push({
    conditionNumber: 5,
    criterion: 'Graduation Year / Batch',
    required: requiredBatch ? `Class of ${requiredBatch}` : 'Any Batch',
    actual: studentBatch ? `Class of ${studentBatch}` : 'Not specified',
    status: batchPass ? 'PASS' : 'FAIL',
    reason: batchPass
      ? `Your graduation year (${studentBatch || 'N/A'}) matches the target batch.`
      : `This drive is exclusively for the Class of ${requiredBatch}, but your batch year is ${studentBatch}.`,
  });

  if (!batchPass) {
    reasons.push(`Drive is open for Class of ${requiredBatch}, but your batch year is ${studentBatch}.`);
  }

  // ==========================================
  // CONDITION 6: MAXIMUM ACTIVE BACKLOGS
  // ==========================================
  const maxActive =
    eligibilityCriteria?.maxActiveBacklogs !== undefined
      ? Number(eligibilityCriteria.maxActiveBacklogs)
      : eligibilityCriteria?.maxBacklogs !== undefined
      ? Number(eligibilityCriteria.maxBacklogs)
      : 0;

  const activePass = studentActiveBacklogs <= maxActive;

  criteriaDetails.push({
    conditionNumber: 6,
    criterion: 'Maximum Active Backlogs',
    required: `${maxActive} active backlog${maxActive === 1 ? '' : 's'} max`,
    actual: `${studentActiveBacklogs} active`,
    status: activePass ? 'PASS' : 'FAIL',
    reason: activePass
      ? `Your active backlogs (${studentActiveBacklogs}) satisfy the limit (max ${maxActive}).`
      : `You currently have ${studentActiveBacklogs} active backlog(s), which exceeds the limit of ${maxActive}.`,
  });

  if (!activePass) {
    reasons.push(`Maximum allowed active backlogs is ${maxActive}, but you currently have ${studentActiveBacklogs}.`);
  }

  // ==========================================
  // CONDITION 7: MAXIMUM TOTAL BACKLOGS
  // ==========================================
  const maxTotal =
    eligibilityCriteria?.maxTotalBacklogs !== undefined
      ? Number(eligibilityCriteria.maxTotalBacklogs)
      : maxActive;

  const totalPass = studentTotalBacklogs <= maxTotal;

  criteriaDetails.push({
    conditionNumber: 7,
    criterion: 'Maximum Total Backlogs',
    required: `${maxTotal} total backlog${maxTotal === 1 ? '' : 's'} max`,
    actual: `${studentTotalBacklogs} total`,
    status: totalPass ? 'PASS' : 'FAIL',
    reason: totalPass
      ? `Your total backlogs history (${studentTotalBacklogs}) is within the allowable limit (max ${maxTotal}).`
      : `Your cumulative backlog count is ${studentTotalBacklogs}, exceeding the maximum of ${maxTotal}.`,
  });

  if (!totalPass) {
    reasons.push(`Maximum allowed cumulative backlogs is ${maxTotal}, but your total is ${studentTotalBacklogs}.`);
  }

  // ==========================================
  // OPERATIONAL DRIVE STATUS & DEADLINE CHECKS
  // ==========================================
  if (drive?.status === 'Draft') {
    reasons.push('Drive is currently in Draft mode and not open for student applications.');
  }

  if (drive?.status === 'Closed' || drive?.status === 'Completed' || drive?.status === 'Cancelled') {
    reasons.push(`Drive status is "${drive.status}". Applications are closed.`);
  }

  const now = new Date();
  const closingDate = drive?.applicationClosingDate || drive?.registrationDeadline;
  if (closingDate && new Date(closingDate) < now) {
    reasons.push('The application deadline for this drive has expired.');
  }

  if (drive?.applicationOpeningDate && new Date(drive.applicationOpeningDate) > now) {
    reasons.push(
      `Applications for this drive will open on ${new Date(drive.applicationOpeningDate).toLocaleDateString()}.`
    );
  }

  const allConditionsPassed = cgpaPass && tenthPass && twelfthPass && deptPass && batchPass && activePass && totalPass;
  const isEligible = allConditionsPassed && reasons.length === 0;

  return {
    isEligible,
    allConditionsPassed,
    hasIncompleteProfile: missingProfileFields.length > 0,
    missingProfileFields,
    summary: isEligible
      ? 'ELIGIBLE - All academic criteria satisfied'
      : missingProfileFields.length > 0 && !allConditionsPassed
      ? 'NOT ELIGIBLE - Incomplete profile and criteria mismatch'
      : 'NOT ELIGIBLE - Academic criteria mismatch',
    criteriaDetails,
    reasons,
  };
};

export default checkEligibility;
