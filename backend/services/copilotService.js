import mongoose from 'mongoose';
import * as tools from './copilotTools.js';
import CopilotConversation from '../models/CopilotConversation.js';

/**
 * Common skill mapping
 */
const KNOWN_SKILLS = [
  'java', 'python', 'javascript', 'typescript', 'c++', 'c', 'c#', 'php', 'sql',
  'react', 'node', 'express', 'spring', 'springboot', 'django', 'flask', 'fastapi',
  'mongodb', 'postgresql', 'mysql', 'redis', 'aws', 'docker', 'kubernetes', 'git',
  'html', 'css', 'tailwind', 'machine learning', 'data structures', 'dsa'
];

/**
 * Natural Language Entity & Intent Parser
 */
const parseIntentAndParameters = (message, lastContext = {}) => {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Contextual Follow-up checks
  const isCgpaRefinement = /^(?:only\s+)?(?:show\s+)?(?:students?\s+)?(?:with\s+)?(?:cgpa\s*)?(?:above|>|>=|\+)\s*(\d+(?:\.\d+)?)/i.test(lower);
  const isResumeFilterFollowup = /(?:how\s+many|show\s+those|which\s+ones?)\s+(?:have|with|without)\s+(?:uploaded\s+)?resumes?/i.test(lower);
  const isProfileFollowup = /^(?:show\s+)?(?:their\s+)?profiles?/i.test(lower);

  if (lastContext.lastTool && (isCgpaRefinement || isResumeFilterFollowup || isProfileFollowup)) {
    // Merge with previous parameters
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

  // 2. Draft Administrative Actions (Staging)
  if (/(?:prepare|draft|create)\s+(?:an?\s+)?announcement/i.test(lower)) {
    // Extract drive/company if mentioned
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

  // 3. Placement Summary & Reports
  if (/(?:monthly\s+placement\s+summary|placement\s+summary|summary\s+of\s+placements|generate\s+report|recruitment\s+summary)/i.test(lower)) {
    return {
      tool: 'getPlacementSummary',
      parameters: { timeframe: lower.includes('month') ? 'monthly' : 'all' },
    };
  }

  // 4. Missing Resumes
  if (/(?:missing\s+resumes?|without\s+(?:any\s+)?resumes?|have\s+not\s+uploaded\s+(?:their\s+)?resumes?|no\s+resume)/i.test(lower)) {
    const deptMatch = extractDepartment(lower);
    return {
      tool: 'getMissingResumes',
      parameters: { department: deptMatch },
    };
  }

  // 5. Preparation Insights & Skill Gaps
  if (/(?:preparation|skill\s+gaps?|need\s+training|technical\s+prep|dsa\s+prep|readiness)/i.test(lower)) {
    return {
      tool: 'getStudentPreparationInsights',
      parameters: {},
    };
  }

  // 6. Upcoming Deadlines
  if (/(?:closing\s+soon|deadlines?|closing\s+within|expiring)/i.test(lower)) {
    let days = 7;
    const dayMatch = lower.match(/(\d+)\s*days?/i);
    if (dayMatch) days = parseInt(dayMatch[1], 10);

    return {
      tool: 'getUpcomingDeadlines',
      parameters: { days },
    };
  }

  // 7. Pending Applications
  if (/(?:pending\s+review|pending\s+applications?|applications?\s+pending|awaiting\s+review)/i.test(lower)) {
    return {
      tool: 'getPendingApplications',
      parameters: {},
    };
  }

  // 8. Eligibility Check for Drive / Company
  if (/(?:eligible\s+for|eligibility|who\s+can\s+apply|matches?\s+for\s+drive)/i.test(lower)) {
    // Extract drive or company name
    let driveName = '';
    const matchFor = lower.match(/(?:for|to)\s+(?:the\s+)?(?:upcoming\s+)?([a-z0-9\s]+?)(?:\s+drive|\s+who|\s+that|\s+with|$)/i);
    if (matchFor && matchFor[1]) {
      driveName = matchFor[1].trim();
    }

    const hasResume = /(?:with|uploaded)\s+resumes?/i.test(lower);
    const minProjects = /(?:at\s+least\s+one\s+project|1\s+project|projects?)/i.test(lower) ? 1 : undefined;

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

  // 9. Drive Applicants / Shortlisted candidates for a drive
  if (/(?:applicants?\s+for|who\s+applied\s+to|shortlisted\s+students?\s+for|candidates?\s+for)/i.test(lower)) {
    let companyName = '';
    const compMatch = lower.match(/(?:for|to)\s+([a-z0-9\s]+?)(?:\s+drive|$)/i);
    if (compMatch) companyName = compMatch[1].trim();

    let status = 'All';
    if (lower.includes('shortlisted')) status = 'Shortlisted';
    if (lower.includes('selected')) status = 'Selected';
    if (lower.includes('rejected')) status = 'Rejected';
    if (lower.includes('pending') || lower.includes('under review')) status = 'Under Review';

    return {
      tool: 'getDriveApplicants',
      parameters: { companyName, status },
    };
  }

  // 10. Placement Drives Intelligence
  if (/(?:active\s+drives?|placement\s+drives?|all\s+drives?|upcoming\s+drives?|drives?\s+for)/i.test(lower)) {
    const dept = extractDepartment(lower);
    let minPackage = undefined;
    const pkgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?)/i);
    if (pkgMatch) minPackage = parseFloat(pkgMatch[1]);

    return {
      tool: 'getPlacementDrives',
      parameters: {
        department: dept,
        minPackage,
        status: lower.includes('active') ? 'Published' : 'All',
      },
    };
  }

  // 11. Statistics & Analytics
  if (/(?:statistics|stats|selection\s+progress|company-wise|department-wise|packages?)/i.test(lower)) {
    return {
      tool: 'getSelectionStatistics',
      parameters: {},
    };
  }

  // 12. Student Search / Filtering (Default fallback for candidate queries)
  const dept = extractDepartment(lower);
  let cgpaMin = undefined;
  let cgpaMax = undefined;

  const cgpaMatch = lower.match(/(?:cgpa\s*(?:above|>|>=)\s*|above\s*)(\d+(?:\.\d+)?)/i);
  if (cgpaMatch) cgpaMin = parseFloat(cgpaMatch[1]);

  const skillsFound = KNOWN_SKILLS.filter((s) => {
    const reg = new RegExp(`\\b${s}\\b`, 'i');
    return reg.test(lower);
  });

  const hasResume = lower.includes('uploaded resume') || lower.includes('with resume')
    ? true
    : lower.includes('without resume') || lower.includes('no resume')
    ? false
    : undefined;

  const minProjects = /(?:at\s+least\s+one\s+project|1\s+project|with\s+projects?)/i.test(lower) ? 1 : undefined;

  return {
    tool: 'searchStudents',
    parameters: {
      query: text.length < 30 && !dept && !cgpaMin && skillsFound.length === 0 ? text : '',
      department: dept,
      cgpaMin,
      cgpaMax,
      skills: skillsFound,
      hasResume,
      minProjects,
    },
  };
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
 * Optional Gemini LLM Intent Refiner
 * When GEMINI_API_KEY is present, enhances conversational natural-language synthesis.
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
    console.warn('[CopilotService] Gemini call skipped, using local synthesizer:', err.message);
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
    // Generate clean concise title from user's first query
    const title = message.trim().length > 40 ? `${message.trim().slice(0, 37)}...` : message.trim();
    conversation = new CopilotConversation({
      officer: officerUser._id,
      title,
      messages: [],
      lastContext: {},
    });
  }

  // 2. Parse Intent and Extract Tool & Parameters
  const lastContext = conversation.lastContext || {};
  const { tool: toolName, parameters: toolParams } = parseIntentAndParameters(message, lastContext);

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
      case 'getMissingResumes':
        responseType = 'STUDENT_TABLE';
        naturalExplanation = `Identified **${toolData.total}** student(s) matching your criteria.`;
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
