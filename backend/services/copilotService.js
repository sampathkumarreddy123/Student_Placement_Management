import mongoose from 'mongoose';
import * as tools from './copilotTools.js';
import CopilotConversation from '../models/CopilotConversation.js';

/**
 * Safe skill detection with pre-compiled regex to prevent regex syntax errors (e.g. c++, c#)
 */
const KNOWN_SKILLS = [
  { name: 'Java', pattern: /\bjava\b/i },
  { name: 'Python', pattern: /\bpython\b/i },
  { name: 'JavaScript', pattern: /\b(?:javascript|js|es6)\b/i },
  { name: 'TypeScript', pattern: /\b(?:typescript|ts)\b/i },
  { name: 'C++', pattern: /(?:\bc\+\+|\bcpp\b)/i },
  { name: 'C#', pattern: /(?:\bc#|\bcsharp\b)/i },
  { name: 'C', pattern: /\bc(?:\s+programming|\s+language)?\b/i },
  { name: 'SQL', pattern: /\bsql\b/i },
  { name: 'React', pattern: /\breact(?:\.js)?\b/i },
  { name: 'Node.js', pattern: /\bnode(?:\.js)?\b/i },
  { name: 'Express.js', pattern: /\bexpress(?:\.js)?\b/i },
  { name: 'Spring Boot', pattern: /\bspring(?:\s*boot)?\b/i },
  { name: 'Django', pattern: /\bdjango\b/i },
  { name: 'Flask', pattern: /\bflask\b/i },
  { name: 'FastAPI', pattern: /\bfastapi\b/i },
  { name: 'MongoDB', pattern: /\bmongodb?\b/i },
  { name: 'PostgreSQL', pattern: /\bpostgre(?:sql)?\b/i },
  { name: 'MySQL', pattern: /\bmysql\b/i },
  { name: 'AWS', pattern: /\baws\b/i },
  { name: 'Docker', pattern: /\bdocker\b/i },
  { name: 'Kubernetes', pattern: /\b(?:kubernetes|k8s)\b/i },
  { name: 'Git', pattern: /\bgit(?:hub)?\b/i },
  { name: 'HTML', pattern: /\bhtml5?\b/i },
  { name: 'CSS', pattern: /\bcss3?\b/i },
  { name: 'Tailwind CSS', pattern: /\btailwind(?:\s*css)?\b/i },
  { name: 'Machine Learning', pattern: /\b(?:machine\s+learning|ml)\b/i },
  { name: 'Data Structures', pattern: /\b(?:data\s+structures|dsa)\b/i },
];

/**
 * Autocorrect and normalize common grammar, typos, and phrasing in placement queries
 */
const normalizeAndCorrectQuery = (text) => {
  if (!text || typeof text !== 'string') return '';
  let clean = text.trim();

  // Common spelling mistakes & typos in campus placement terminology
  const TYPO_MAP = [
    { pattern: /\b(?:resmue|resme|resum|reume|reusme|rezume)\b/gi, replacement: 'resume' },
    { pattern: /\b(?:baclog|baclogs|backlg|backlgs|back log|back logs|arrear|arrears|kt|kts)\b/gi, replacement: 'backlog' },
    { pattern: /\b(?:palced|plased|placeed|pleced|plcd)\b/gi, replacement: 'placed' },
    { pattern: /\b(?:unplased|unpalced|un-placed|not\s+palced|not\s+plased)\b/gi, replacement: 'unplaced' },
    { pattern: /\b(?:selcted|selct|selctd|selcted)\b/gi, replacement: 'selected' },
    { pattern: /\b(?:shortlised|shortlistd|shorlisted)\b/gi, replacement: 'shortlisted' },
    { pattern: /\b(?:eligble|eligibal|elgible|elegible)\b/gi, replacement: 'eligible' },
    { pattern: /\b(?:compnay|compny|comapny|compnies)\b/gi, replacement: 'company' },
    { pattern: /\b(?:stdent|studnts|studnt|studens|stduent|stduents)\b/gi, replacement: 'student' },
    { pattern: /\b(?:deprtment|departmnt|dprtmnt|brach|brnach)\b/gi, replacement: 'department' },
    { pattern: /\b(?:aplication|applicatn|aplied|appled)\b/gi, replacement: 'applied' },
    { pattern: /\b(?:packge|pakage|pkg|salry|slary)\b/gi, replacement: 'package' },
    { pattern: /\b(?:infosis|infy)\b/gi, replacement: 'infosys' },
    { pattern: /\b(?:deadln|dead line)\b/gi, replacement: 'deadline' },
  ];

  for (const { pattern, replacement } of TYPO_MAP) {
    clean = clean.replace(pattern, replacement);
  }

  return clean;
};

/**
 * Checks if input is an actual student name or roll number rather than an analytical question
 */
const detectPersonOrRoll = (text, lower) => {
  // Check for Roll Number pattern (e.g. 21691A0501, 25695A0545, 22691A04B2)
  const rollMatch = text.match(/\b\d{2}[A-Za-z0-9]{8,10}\b/i);
  if (rollMatch) {
    return { isRoll: true, rollNumber: rollMatch[0].toUpperCase() };
  }

  // Stop-words that clearly indicate this is an analytical question or filter, NOT a person's name
  const QUESTION_KEYWORDS = [
    'how', 'many', 'what', 'which', 'who', 'where', 'when', 'why', 'is', 'are', 'was', 'were',
    'tell', 'show', 'list', 'give', 'find', 'get', 'check', 'search', 'any', 'all', 'have', 'has',
    'student', 'students', 'drive', 'drives', 'company', 'companies', 'package', 'lpa', 'cgpa', 'gpa',
    'marks', 'resume', 'resumes', 'backlog', 'backlogs', 'department', 'dept', 'branch', 'placed',
    'unplaced', 'selected', 'shortlisted', 'eligible', 'eligibility', 'details', 'summary', 'summarize', 'summarise', 'report',
    'prep', 'preparation', 'announcement', 'shortlist', 'there', 'having', 'with', 'without', 'above',
    'below', 'greater', 'less', 'highest', 'average', 'lowest', 'active', 'closing', 'deadline'
  ];

  const words = lower.split(/\s+/).filter(Boolean);
  const containsQuestionWord = words.some((w) => QUESTION_KEYWORDS.includes(w));

  // If it's 1-3 words, doesn't contain question words, and starts with letters, it may be a name query
  if (!containsQuestionWord && words.length >= 1 && words.length <= 3 && /^[a-zA-Z\s.]+$/.test(text.trim())) {
    return { isName: true, name: text.trim() };
  }

  return { isRoll: false, isName: false };
};

/**
 * Helper to identify department keyword in query
 */
const extractDepartment = (lower) => {
  if (/\b(?:cse|computer\s+science)\b/i.test(lower)) return 'Computer Science';
  if (/\b(?:it|information\s+technology)\b/i.test(lower)) return 'Information Technology';
  if (/\b(?:ece|electronics)\b/i.test(lower)) return 'Electronics & Communication';
  if (/\b(?:eee|electrical)\b/i.test(lower)) return 'Electrical Engineering';
  if (/\b(?:mech|mechanical)\b/i.test(lower)) return 'Mechanical Engineering';
  if (/\b(?:civil)\b/i.test(lower)) return 'Civil Engineering';
  return undefined;
};

/**
 * Natural Language Entity & Intent Parser
 */
const parseIntentAndParameters = (message, lastContext = {}) => {
  const corrected = normalizeAndCorrectQuery(message);
  const lower = corrected.toLowerCase();
  const text = message.trim();

  // 1. Direct Roll Number Lookup
  const personCheck = detectPersonOrRoll(text, lower);
  if (personCheck.isRoll) {
    return {
      tool: 'getStudentDetails',
      parameters: { rollNumber: personCheck.rollNumber },
    };
  }

  // 2. Contextual Follow-up checks
  const isCgpaRefinement = /^(?:only\s+)?(?:show\s+)?(?:students?\s+)?(?:with\s+)?(?:cgpa\s*)?(?:above|>|>=|\+)\s*(\d+(?:\.\d+)?)/i.test(lower);
  const isResumeFilterFollowup = /(?:how\s+many|show\s+those|which\s+ones?)\s+(?:have|with|without)\s+(?:uploaded\s+)?resumes?/i.test(lower);
  const isProfileFollowup = /^(?:show\s+)?(?:their\s+)?profiles?/i.test(lower);

  if (lastContext.lastTool && (isCgpaRefinement || isResumeFilterFollowup || isProfileFollowup)) {
    const params = { ...(lastContext.lastParameters || {}) };

    if (isCgpaRefinement) {
      const match = lower.match(/(?:above|>|>=|\+)\s*(\d+(?:\.\d+)?)/i);
      if (match) params.cgpaMin = parseFloat(match[1]);
    }

    if (isResumeFilterFollowup) {
      params.hasResume = !lower.includes('without');
    }

    return {
      tool: lastContext.lastTool,
      parameters: params,
      isFollowUp: true,
    };
  }

  // 3. Draft Administrative Actions (Staging)
  if (/(?:prepare|draft|create)\s+(?:an?\s+)?announcement/i.test(lower)) {
    let driveName = '';
    const driveMatch = lower.match(/for\s+(?:the\s+)?([a-z0-9\s]+?)(?:\s+drive|\s+role|$)/i);
    if (driveMatch) driveName = driveMatch[1].trim();

    return {
      tool: 'prepareAnnouncementDraft',
      parameters: { title: text.length > 50 ? text.slice(0, 60) : '', driveName },
    };
  }

  if (/(?:prepare|draft|propose)\s+(?:a\s+)?shortlist/i.test(lower)) {
    let minCgpa = 7.5;
    const cgpaMatch = lower.match(/(?:above|cgpa|min|cutoff)\s*(\d+(?:\.\d+)?)/i);
    if (cgpaMatch) minCgpa = parseFloat(cgpaMatch[1]);

    return {
      tool: 'prepareShortlistDraft',
      parameters: { minCgpa },
    };
  }

  // 4. Placement Summary & Overview Reports
  if (/(?:placement\s+summary|summariz(?:e|ing)\s+placements?|summarise\s+placements?|monthly\s+placement\s+summary|summary\s+of\s+placements?|generate\s+report|recruitment\s+summary|overall\s+placement)/i.test(lower)) {
    return {
      tool: 'getPlacementSummary',
      parameters: { timeframe: lower.includes('month') ? 'monthly' : 'all' },
    };
  }

  // 5. Missing Resumes Queries
  if (/(?:missing\s+resumes?|without\s+(?:any\s+)?resumes?|have\s+not\s+uploaded\s+(?:their\s+)?resumes?|not\s+uploaded\s+resumes?|no\s+resume)/i.test(lower)) {
    const deptMatch = extractDepartment(lower);
    return {
      tool: 'getMissingResumes',
      parameters: { department: deptMatch },
    };
  }

  // 6. Student Preparation Insights & Skill Gaps
  if (/(?:preparation|skill\s+gaps?|need\s+training|technical\s+prep|dsa\s+prep|readiness)/i.test(lower)) {
    return {
      tool: 'getStudentPreparationInsights',
      parameters: {},
    };
  }

  // 7. Upcoming Deadlines & Drives Expiring Soon
  if (/(?:closing\s+soon|deadlines?|closing\s+within|expiring)/i.test(lower)) {
    let days = 7;
    const dayMatch = lower.match(/(\d+)\s*days?/i);
    if (dayMatch) days = parseInt(dayMatch[1], 10);

    return {
      tool: 'getUpcomingDeadlines',
      parameters: { days },
    };
  }

  // 8. Pending Applications Awaiting Review
  if (/(?:pending\s+review|pending\s+applications?|applications?\s+pending|awaiting\s+review|under\s+review)/i.test(lower)) {
    return {
      tool: 'getPendingApplications',
      parameters: {},
    };
  }

  // 9. Eligibility Check for Drive / Company
  if (/(?:eligible\s+for|eligibility|who\s+can\s+apply|matches?\s+for\s+drive|students?\s+eligible)/i.test(lower)) {
    let driveName = '';
    const matchFor = lower.match(/(?:for|to)\s+(?:the\s+)?(?:upcoming\s+)?([a-z0-9\s]+?)(?:\s+drive|\s+who|\s+that|\s+with|$)/i);
    if (matchFor && matchFor[1]) {
      driveName = matchFor[1].trim();
    }

    const hasResume = /(?:with|uploaded)\s+resumes?/i.test(lower);
    const minProjects = /(?:at\s+least\s+one\s+project|1\s+project|with\s+projects?)/i.test(lower) ? 1 : undefined;

    let cgpaMin = undefined;
    const cgpaMatch = lower.match(/(?:cgpa\s*(?:above|>|>=)\s*|above\s*)(\d+(?:\.\d+)?)/i);
    if (cgpaMatch) cgpaMin = parseFloat(cgpaMatch[1]);

    const dept = extractDepartment(lower);

    return {
      tool: 'getStudentEligibility',
      parameters: {
        driveName,
        hasResume: hasResume ? true : undefined,
        minProjects,
        cgpaMin,
        department: dept,
      },
    };
  }

  // 10. Drive Applicants / Shortlisted / Selected Candidates for a Company or Drive
  if (/(?:applicants?\s+for|who\s+applied\s+to|shortlisted\s+students?\s+for|candidates?\s+for|who\s+got\s+selected\s+in|selected\s+in)/i.test(lower)) {
    let companyName = '';
    const compMatch = lower.match(/(?:for|to|in)\s+([a-z0-9\s]+?)(?:\s+drive|$)/i);
    if (compMatch) companyName = compMatch[1].trim();

    let status = 'All';
    if (lower.includes('selected')) status = 'Selected';
    else if (lower.includes('shortlisted')) status = 'Shortlisted';
    else if (lower.includes('rejected')) status = 'Rejected';
    else if (lower.includes('pending') || lower.includes('under review')) status = 'Under Review';

    return {
      tool: 'getDriveApplicants',
      parameters: { companyName, status },
    };
  }

  // 11. Drive Details or Drive Intelligence
  if (/(?:tell\s+me\s+about|details\s+of|show\s+drive|info\s+about)\s+([a-z0-9\s]+?)(?:\s+drive|$)/i.test(lower)) {
    const dMatch = lower.match(/(?:tell\s+me\s+about|details\s+of|show\s+drive|info\s+about)\s+([a-z0-9\s]+?)(?:\s+drive|$)/i);
    return {
      tool: 'getDriveDetails',
      parameters: { companyName: dMatch?.[1]?.trim() || '' },
    };
  }

  // 12. Active Placement Drives List
  if (/(?:active\s+drives?|placement\s+drives?|all\s+drives?|upcoming\s+drives?|drives?\s+available)/i.test(lower)) {
    const dept = extractDepartment(lower);
    let minPackage = undefined;
    const pkgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?)/i);
    if (pkgMatch) minPackage = parseFloat(pkgMatch[1]);

    return {
      tool: 'getPlacementDrives',
      parameters: {
        department: dept,
        minPackage,
        status: lower.includes('upcoming') ? 'Upcoming' : 'Published',
      },
    };
  }

  // 13. Placement Statistics, Packages, Selection Rate
  if (/(?:statistics|stats|selection\s+progress|company-wise|department-wise|highest\s+package|average\s+package|best\s+salary|placement\s+rate|placement\s+percentage|how\s+many\s+(?:students\s+are\s+)?placed)/i.test(lower)) {
    return {
      tool: 'getSelectionStatistics',
      parameters: {},
    };
  }

  // 14. Unplaced vs Placed Student Queries
  const isUnplacedQuery = /\b(?:unplaced|not\s+placed|not\s+yet\s+placed|without\s+job|without\s+placement|pending\s+placement)\b/i.test(lower);
  const isPlacedListQuery = /\b(?:placed\s+students?|who\s+(?:are|is)\s+placed|got\s+placed|got\s+job|who\s+got\s+job)\b/i.test(lower);

  // 15. Backlogs Queries
  const hasZeroBacklogs = /\b(?:no\s+backlogs?|0\s+backlogs?|zero\s+backlogs?|without\s+backlogs?|clear\s+standing|no\s+arrears?)\b/i.test(lower);
  const hasActiveBacklogs = /\b(?:with\s+backlogs?|active\s+backlogs?|have\s+backlogs?|having\s+backlogs?|any\s+backlog)\b/i.test(lower);

  // 16. Department & CGPA & Skill Student Search / Counts
  const dept = extractDepartment(lower);

  let cgpaMin = undefined;
  let cgpaMax = undefined;

  const cgpaMinMatch = lower.match(/(?:cgpa\s*(?:above|>|>=|\+)\s*|above\s*|greater\s+than\s*|>\s*)(\d+(?:\.\d+)?)/i);
  if (cgpaMinMatch) cgpaMin = parseFloat(cgpaMinMatch[1]);

  const cgpaMaxMatch = lower.match(/(?:cgpa\s*(?:below|<|<=)\s*|below\s*|less\s+than\s*|<\s*)(\d+(?:\.\d+)?)/i);
  if (cgpaMaxMatch) cgpaMax = parseFloat(cgpaMaxMatch[1]);

  const skillsFound = KNOWN_SKILLS
    .filter((item) => item.pattern.test(lower))
    .map((item) => item.name);

  const hasResume = /(?:uploaded\s+resumes?|with\s+resumes?)/i.test(lower)
    ? true
    : /(?:without\s+resumes?|no\s+resumes?|missing\s+resumes?)/i.test(lower)
    ? false
    : undefined;

  const minProjects = /(?:at\s+least\s+one\s+project|1\s+project|with\s+projects?)/i.test(lower) ? 1 : undefined;

  // IMPORTANT: Only pass `query` text if the user actually typed a person's name!
  const queryName = personCheck.isName ? personCheck.name : '';

  return {
    tool: 'searchStudents',
    parameters: {
      query: queryName,
      department: dept,
      cgpaMin,
      cgpaMax,
      skills: skillsFound,
      hasResume,
      hasBacklogs: hasZeroBacklogs ? false : hasActiveBacklogs ? true : undefined,
      placementStatus: isUnplacedQuery ? 'Not Placed' : isPlacedListQuery ? 'Placed' : undefined,
      minProjects,
    },
  };
};

/**
 * Optional Gemini LLM Intent Parser
 * If GEMINI_API_KEY is configured, leverages Gemini to analyze intent and parameters with advanced reasoning.
 */
const parseIntentWithGemini = async (userMessage) => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const prompt = `You are the Intent Classifier for an AI Placement Officer Copilot in a university placement management portal.
Map this Placement Officer instruction to one of the approved tools and extract structured parameters.

Approved Tools:
1. "searchStudents": Filters students. Params: { query, department ('Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'), cgpaMin (number), cgpaMax (number), skills (array), hasResume (boolean), hasBacklogs (boolean), placementStatus ('Placed' | 'Not Placed') }
2. "getStudentDetails": Params: { rollNumber (string), studentId (string) }
3. "getStudentEligibility": Params: { driveName (string), department (string), cgpaMin (number), hasResume (boolean) }
4. "getPlacementDrives": Params: { status ('Published' | 'Upcoming' | 'All'), department (string), minPackage (number) }
5. "getDriveDetails": Params: { companyName (string), driveId (string) }
6. "getDriveApplicants": Params: { companyName (string), status ('All' | 'Shortlisted' | 'Selected' | 'Rejected' | 'Under Review') }
7. "getApplicationStatistics": Params: { timeframe ('month' | 'all') }
8. "getSelectionStatistics": Params: {}
9. "getUpcomingDeadlines": Params: { days (number) }
10. "getMissingResumes": Params: { department (string) }
11. "getPendingApplications": Params: {}
12. "getPlacementSummary": Params: { timeframe ('monthly' | 'all') }
13. "getStudentPreparationInsights": Params: {}
14. "prepareAnnouncementDraft": Params: { title (string), driveName (string) }
15. "prepareShortlistDraft": Params: { minCgpa (number) }

Instruction: "${userMessage}"

Respond strictly with valid JSON only in this format:
{
  "tool": "toolName",
  "parameters": {}
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool && typeof tools[parsed.tool] === 'function') {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[CopilotService] Gemini intent parsing skipped, using local semantic engine:', err.message);
  }
  return null;
};

/**
 * Optional Gemini Conversational Synthesizer
 */
const enrichWithGemini = async (userMessage, toolName, toolResult) => {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const systemPrompt = `You are the AI Placement Officer Copilot inside a university Placement Management Portal.
The officer asked: "${userMessage}".
The backend executed tool "${toolName}" and retrieved real database records.
Summary of data retrieved: ${JSON.stringify(toolResult).slice(0, 1500)}

Write a professional, concise, executive explanation (2 to 4 sentences).
Highlight key figures, counts, and practical recommendations.
Do NOT repeat raw JSON. Do NOT use fake numbers.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
  } catch (err) {
    console.warn('[CopilotService] Gemini enrichment skipped:', err.message);
  }
  return null;
};

/**
 * Main Copilot Chat Orchestrator
 */
export const processCopilotMessage = async ({ message, conversationId, officerUser }) => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message content is required.');
  }

  // 1. Retrieve or Create Conversation
  let conversation = null;
  if (conversationId && mongoose.isValidObjectId(conversationId)) {
    conversation = await CopilotConversation.findOne({
      _id: conversationId,
      officer: officerUser._id,
    });
  }

  if (!conversation) {
    const title = message.trim().length > 40 ? `${message.trim().slice(0, 37)}...` : message.trim();
    conversation = new CopilotConversation({
      officer: officerUser._id,
      title,
      messages: [],
      lastContext: {},
    });
  }

  // 2. Parse Intent and Extract Tool & Parameters (Gemini with fallback to semantic engine)
  const lastContext = conversation.lastContext || {};
  let toolResolution = await parseIntentWithGemini(message);

  if (!toolResolution || !toolResolution.tool) {
    toolResolution = parseIntentAndParameters(message, lastContext);
  }

  const { tool: toolName, parameters: toolParams } = toolResolution;

  // 3. Execute Selected Backend Tool safely
  let toolData = null;
  let responseType = 'TEXT';
  let naturalExplanation = '';

  try {
    if (typeof tools[toolName] === 'function') {
      toolData = await tools[toolName](toolParams);
    } else {
      toolData = await tools.searchStudents(toolParams);
    }
  } catch (toolErr) {
    console.error(`[CopilotToolError] Execution of ${toolName} failed:`, toolErr);
    toolData = { error: toolErr.message };
    responseType = 'ERROR';
    naturalExplanation = `An error occurred while accessing the database for this query: ${toolErr.message}`;
  }

  // 4. Map Tool Output to Standard Response Types and Conversational Synthesis
  if (!toolData || toolData.error) {
    responseType = 'ERROR';
    naturalExplanation = toolData?.error || 'Unable to retrieve records for the requested parameters.';
  } else {
    switch (toolName) {
      case 'getStudentEligibility':
        responseType = 'STUDENT_TABLE';
        naturalExplanation = `Found **${toolData.eligibleCount}** eligible student(s) for **${toolData.drive?.title || 'the drive'}** (${toolData.drive?.company || 'Company'}). ${toolData.ineligibleCount} student(s) did not meet all criteria.`;
        break;

      case 'searchStudents':
        responseType = 'STUDENT_TABLE';
        if (toolParams?.placementStatus === 'Not Placed') {
          naturalExplanation = `There are currently **${toolData.total}** unplaced student(s) registered in the portal${toolParams.department ? ` (${toolParams.department})` : ''}.`;
        } else if (toolParams?.placementStatus === 'Placed') {
          naturalExplanation = `Found **${toolData.total}** placed student(s)${toolParams.department ? ` in ${toolParams.department}` : ''}.`;
        } else if (toolParams?.hasBacklogs === true) {
          naturalExplanation = `Found **${toolData.total}** student(s) with active backlogs${toolParams.department ? ` in ${toolParams.department}` : ''}.`;
        } else if (toolParams?.hasBacklogs === false) {
          naturalExplanation = `Found **${toolData.total}** student(s) with 0 active backlogs (clear academic standing).`;
        } else if (toolParams?.department) {
          naturalExplanation = `There are currently **${toolData.total}** student(s) enrolled in the **${toolParams.department}** department${toolParams.cgpaMin ? ` with CGPA >= ${toolParams.cgpaMin}` : ''}.`;
        } else if (toolParams?.skills && toolParams.skills.length > 0) {
          naturalExplanation = `Found **${toolData.total}** student(s) proficient in **${toolParams.skills.join(', ')}**.`;
        } else if (toolParams?.hasResume === false) {
          naturalExplanation = `Found **${toolData.total}** student(s) who have not uploaded their verified resumes.`;
        } else if (toolParams?.cgpaMin) {
          naturalExplanation = `Found **${toolData.total}** student(s) with CGPA >= **${toolParams.cgpaMin}**.`;
        } else if (toolParams?.query) {
          naturalExplanation = `Found **${toolData.total}** candidate record(s) matching "${toolParams.query}".`;
        } else {
          naturalExplanation = `Identified **${toolData.total}** student(s) matching your request.`;
        }
        break;

      case 'getStudentDetails':
        responseType = 'STUDENT_TABLE';
        naturalExplanation = `Retrieved academic profile for **${toolData.student?.name}** (${toolData.student?.rollNumber}, ${toolData.student?.department}, CGPA: ${toolData.student?.cgpa}).`;
        toolData = { students: [toolData.student] };
        break;

      case 'getMissingResumes':
        responseType = 'STUDENT_TABLE';
        naturalExplanation = `Found **${toolData.total}** student(s) who have not uploaded their verified PDF resumes.`;
        break;

      case 'getPlacementDrives':
      case 'getUpcomingDeadlines':
        responseType = 'DRIVE_TABLE';
        naturalExplanation = `Retrieved **${toolData.total}** placement drive(s) matching your criteria.`;
        break;

      case 'getDriveApplicants':
      case 'getPendingApplications':
        responseType = 'APPLICATION_TABLE';
        naturalExplanation = `Retrieved **${toolData.total || toolData.totalPending}** application record(s).`;
        break;

      case 'getDriveDetails':
        responseType = 'DRIVE_TABLE';
        naturalExplanation = `Retrieved placement drive details for **${toolData.drive?.title}** (${toolData.drive?.company}). Total Applicants: ${toolData.statusBreakdown?.total || 0}.`;
        toolData = { drives: [toolData.drive] };
        break;

      case 'getApplicationStatistics':
      case 'getSelectionStatistics':
        responseType = 'STATISTICS';
        naturalExplanation = `Generated real-time recruitment metrics from live student applications and placement drives.`;
        break;

      case 'getPlacementSummary':
        responseType = 'REPORT';
        naturalExplanation = `Institutional Placement Summary for **${toolData.period}**. Live campus drive metrics and department breakdowns are compiled below.`;
        break;

      case 'getStudentPreparationInsights':
        responseType = 'RECOMMENDATIONS';
        naturalExplanation = `Aggregated technical skill demand vs student supply across verified resumes. Average student resume quality score is **${toolData.averageResumeQualityScore}/100**.`;
        break;

      case 'prepareAnnouncementDraft':
      case 'prepareShortlistDraft':
        responseType = 'CONFIRMATION_REQUIRED';
        naturalExplanation = `I have drafted this administrative action based on live database records. Please review the details below. **No changes will be applied without your explicit confirmation.**`;
        break;

      default:
        responseType = 'TEXT';
        naturalExplanation = 'Processed query and retrieved current database records.';
    }
  }

  // Optional AI enrichment via Gemini if configured
  if (responseType !== 'ERROR' && responseType !== 'CONFIRMATION_REQUIRED') {
    const aiText = await enrichWithGemini(message, toolName, toolData);
    if (aiText) {
      naturalExplanation = aiText;
    }
  }

  // 5. Append User and Assistant Messages
  conversation.messages.push({
    role: 'user',
    content: message.trim(),
    timestamp: new Date(),
  });

  const assistantMessage = {
    role: 'assistant',
    content: naturalExplanation,
    responseType,
    data: toolData,
    toolCalled: toolName,
    toolParameters: toolParams,
    timestamp: new Date(),
  };

  conversation.messages.push(assistantMessage);

  // Update contextual memory
  conversation.lastContext = {
    lastTool: toolName,
    lastParameters: toolParams,
    lastDriveId: toolData?.drive?.id || toolData?.driveId || null,
    lastCompany: toolData?.drive?.company || null,
    lastStudentCount: toolData?.students?.length || toolData?.total || 0,
  };

  await conversation.save();

  return {
    conversationId: conversation._id,
    title: conversation.title,
    message: assistantMessage,
  };
};
