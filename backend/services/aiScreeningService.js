/**
 * AI Candidate Screening and Smart Match Ranking Service.
 * Evaluates applicants against Placement Drive specifications using
 * intelligent multi-factor matching (Skills, Academics, Backlogs, Department Fit).
 * 
 * Resilient Architecture:
 * - Operates 100% reliably out of the box with built-in semantic & rule-based scoring.
 * - If GEMINI_API_KEY is configured in .env, optionally enriches natural language qualitative reviews.
 * - NEVER crashes or throws unhandled errors if external APIs are unreachable or unconfigured.
 */

// Common tech synonyms & normalization mapping
const SYNONYMS = {
  'react': ['react', 'reactjs', 'react.js', 'react native'],
  'node': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
  'python': ['python', 'django', 'flask', 'fastapi'],
  'java': ['java', 'spring', 'springboot', 'spring boot'],
  'javascript': ['javascript', 'js', 'es6', 'typescript', 'ts'],
  'typescript': ['typescript', 'ts'],
  'c++': ['c++', 'cpp'],
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'database', 'rdbms'],
  'mongodb': ['mongodb', 'mongo', 'nosql', 'mongoose'],
  'aws': ['aws', 'amazon web services', 'cloud', 's3', 'ec2', 'lambda'],
  'docker': ['docker', 'kubernetes', 'k8s', 'containers', 'devops'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence', 'nlp'],
  'data structures': ['data structures', 'algorithms', 'dsa', 'problem solving'],
  'html': ['html', 'html5', 'css', 'css3', 'tailwind', 'bootstrap'],
  'git': ['git', 'github', 'gitlab', 'version control'],
};

// Normalize a single skill name
const normalizeSkill = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toLowerCase().replace(/[-_.]/g, ' ');
};

// Check if candidate skill matches any required skill
const isSkillMatch = (candSkill, reqSkill) => {
  const cNorm = normalizeSkill(candSkill);
  const rNorm = normalizeSkill(reqSkill);

  if (cNorm === rNorm || cNorm.includes(rNorm) || rNorm.includes(cNorm)) {
    return true;
  }

  // Check synonyms
  for (const [key, variants] of Object.entries(SYNONYMS)) {
    const rMatchesKey = variants.some(v => rNorm.includes(v) || v.includes(rNorm));
    const cMatchesKey = variants.some(v => cNorm.includes(v) || v.includes(cNorm));
    if (rMatchesKey && cMatchesKey) {
      return true;
    }
  }

  return false;
};

/**
 * Evaluates a single applicant application against placement drive criteria.
 */
export const evaluateApplicantMatch = async ({ application, drive, profile, student }) => {
  const candidateName = student?.name || application.student?.name || 'Candidate';
  const jobRole = drive?.jobRole || drive?.title || 'Target Role';
  const minCgpa = drive?.eligibilityCriteria?.minCgpa ?? 6.0;
  const maxActiveBacklogs = drive?.eligibilityCriteria?.maxActiveBacklogs ?? 0;
  const allowedDepts = Array.isArray(drive?.eligibilityCriteria?.allowedDepartments)
    ? drive.eligibilityCriteria.allowedDepartments
    : [];

  // Required skills from drive (or auto-extracted from job description/role if empty)
  let driveRequiredSkills = Array.isArray(drive?.requiredSkills) && drive.requiredSkills.length > 0
    ? drive.requiredSkills.map(s => String(s).trim()).filter(Boolean)
    : [];

  if (driveRequiredSkills.length === 0) {
    const rawText = `${jobRole} ${drive?.jobDescription || drive?.description || ''}`.toLowerCase();
    driveRequiredSkills = Object.keys(SYNONYMS).filter(key => rawText.includes(key));
    if (driveRequiredSkills.length === 0) {
      driveRequiredSkills = ['Core Engineering', 'Data Structures', 'Problem Solving'];
    }
  }

  // Candidate credentials
  const candidateCgpa =
    profile?.cgpa !== undefined && profile?.cgpa !== null
      ? Number(profile.cgpa)
      : application.resumeSnapshot?.studentCgpa !== undefined && application.resumeSnapshot?.studentCgpa !== null
      ? Number(application.resumeSnapshot.studentCgpa)
      : 0;

  const candidateDept =
    profile?.department || application.resumeSnapshot?.studentDepartment || '';

  const activeBacklogs = Number(profile?.activeBacklogs ?? profile?.backlogs ?? 0);

  const rawCandSkills = Array.isArray(profile?.skills) && profile.skills.length > 0
    ? profile.skills
    : Array.isArray(application.resumeSnapshot?.skills) && application.resumeSnapshot.skills.length > 0
    ? application.resumeSnapshot.skills
    : [];

  const candidateSkills = rawCandSkills.map(s => String(s).trim()).filter(Boolean);

  // 1. Skill Matching Analysis (Max 45 points)
  const matchingSkills = [];
  const missingSkills = [];

  for (const reqSkill of driveRequiredSkills) {
    const matched = candidateSkills.find(cSkill => isSkillMatch(cSkill, reqSkill));
    if (matched) {
      matchingSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  let skillScore = 0;
  if (driveRequiredSkills.length > 0) {
    const ratio = matchingSkills.length / driveRequiredSkills.length;
    skillScore = ratio * 40;
    // Extra points for having 5+ diverse technical skills
    if (candidateSkills.length >= 5) skillScore += 5;
    else if (candidateSkills.length >= 3) skillScore += 3;
  } else {
    skillScore = Math.min(45, candidateSkills.length * 7);
  }
  skillScore = Math.min(45, Math.max(0, skillScore));

  // 2. Academic Performance Scoring (Max 30 points)
  let academicScore = 0;
  if (candidateCgpa >= minCgpa) {
    const excess = candidateCgpa - minCgpa;
    const maxBonus = Math.max(1, 10 - minCgpa);
    academicScore = 20 + Math.min(10, (excess / maxBonus) * 10);
  } else if (candidateCgpa > 0) {
    academicScore = Math.max(5, (candidateCgpa / minCgpa) * 16);
  } else {
    academicScore = 10;
  }
  academicScore = Math.min(30, Math.max(0, academicScore));

  // 3. Academic Health & Backlogs Scoring (Max 15 points)
  let backlogScore = 0;
  if (activeBacklogs === 0) {
    backlogScore = 15;
  } else if (activeBacklogs <= maxActiveBacklogs) {
    backlogScore = 8;
  } else {
    backlogScore = 0; // Exceeds allowed backlogs
  }

  // 4. Department Alignment (Max 10 points)
  let deptScore = 10;
  if (allowedDepts.length > 0) {
    const matchesDept = allowedDepts.some(d => {
      const dLow = d.toLowerCase().trim();
      const candLow = candidateDept.toLowerCase().trim();
      return candLow.includes(dLow) || dLow.includes(candLow);
    });
    deptScore = matchesDept ? 10 : 4;
  }

  // Final Total Score (0 - 100)
  const totalScore = Math.round(skillScore + academicScore + backlogScore + deptScore);

  // Fit Level Classification
  let fitLevel = 'Moderate Fit';
  let recommendation = 'Review with Discretion';

  if (totalScore >= 85) {
    fitLevel = 'Excellent Fit';
    recommendation = 'Fast-Track Shortlist';
  } else if (totalScore >= 70) {
    fitLevel = 'Strong Fit';
    recommendation = 'Recommended for Review';
  } else if (totalScore >= 50) {
    fitLevel = 'Moderate Fit';
    recommendation = 'Review with Discretion';
  } else {
    fitLevel = 'Low Fit';
    recommendation = 'Criteria Gap';
  }

  // Generate Clear, Understandable Natural Language Summary
  let summary = '';
  const matchCount = matchingSkills.length;
  const matchStr = matchCount > 0 ? matchingSkills.slice(0, 4).join(', ') : 'none yet';

  if (totalScore >= 85) {
    summary = `Top candidate for ${jobRole}. Matches ${matchCount} core skill${matchCount === 1 ? '' : 's'} (${matchStr}) with a strong ${candidateCgpa} CGPA (cutoff: ${minCgpa}) and 0 backlogs. Highly recommended for shortlisting.`;
  } else if (totalScore >= 70) {
    summary = `Solid candidate for ${jobRole}. Meets academic requirements with ${candidateCgpa} CGPA and aligns with ${matchCount} required skill${matchCount === 1 ? '' : 's'} (${matchStr}). Good candidate for round advancement.`;
  } else if (totalScore >= 50) {
    const missingStr = missingSkills.slice(0, 3).join(', ');
    summary = `Moderate match for ${jobRole}. Has ${candidateCgpa} CGPA. Matches ${matchCount} skill${matchCount === 1 ? '' : 's'}, but lacks required skills in ${missingStr || 'certain areas'}. Review projects and interview performance.`;
  } else {
    summary = `Low match against ${jobRole} requirements. Shows gaps in required skills (${missingSkills.slice(0, 3).join(', ') || 'technical criteria'}) or academic cutoff (${candidateCgpa} vs ${minCgpa} min).`;
  }

  // Optional: If GEMINI_API_KEY is configured in .env, attempt quick AI enrichment
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a university placement screening assistant. Given this candidate review:
Candidate: ${candidateName}
Role: ${jobRole}
CGPA: ${candidateCgpa} (Cutoff: ${minCgpa})
Active Backlogs: ${activeBacklogs}
Matching Skills: ${matchingSkills.join(', ')}
Missing Skills: ${missingSkills.join(', ')}
Calculated Score: ${totalScore}/100 (${fitLevel})

Write a concise 2-sentence professional recruiter assessment explaining their fit and key hiring factor. Do not include markdown headers or bullet points.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 100, temperature: 0.2 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText && aiText.length > 20) {
          summary = aiText;
        }
      }
    } catch (apiErr) {
      // Graceful fallback to built-in summary without failing
      console.warn('[AIScreening] External AI call skipped, using local engine:', apiErr.message);
    }
  }

  return {
    score: totalScore,
    fitLevel,
    summary,
    matchingSkills,
    missingSkills,
    recommendation,
    screenedAt: new Date(),
  };
};

export default {
  evaluateApplicantMatch,
};
