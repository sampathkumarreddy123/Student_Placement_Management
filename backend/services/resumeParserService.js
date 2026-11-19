/**
 * Smart Resume Parser Service.
 * Extracts structured candidate profile data directly from uploaded PDF resumes.
 * Automatically identifies:
 * - Technical Skills
 * - Cumulative CGPA
 * - 10th & 12th / Diploma Percentages
 * - Mobile Phone
 * - Contact Email
 * - GitHub and LinkedIn URLs
 * - Department / Engineering Branch
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Comprehensive dictionary of technical skills
const SKILLS_CATALOG = [
  { name: 'React', patterns: [/\breact(?:\.js|js)?\b/i, /\breact native\b/i] },
  { name: 'Node.js', patterns: [/\bnode(?:\.js|js)?\b/i, /\bexpress(?:\.js|js)?\b/i] },
  { name: 'JavaScript', patterns: [/\bjavascript\b/i, /\bes6\b/i] },
  { name: 'TypeScript', patterns: [/\btypescript\b/i, /\bts\b/i] },
  { name: 'Python', patterns: [/\bpython\b/i, /\bdjango\b/i, /\bflask\b/i, /\bfastapi\b/i] },
  { name: 'Java', patterns: [/\bjava\b/i, /\bspring\b/i, /\bspringboot\b/i, /\bspring boot\b/i] },
  { name: 'C++', patterns: [/\bc\+\+/i, /\bcpp\b/i] },
  { name: 'C', patterns: [/\bC\s*(?:&|and)\s*C\+\+/i, /\bC(?:\s+programming|\s+language)\b/i, /\b(?<![a-zA-Z0-9])C(?![a-zA-Z0-9+#])/] },
  { name: 'SQL', patterns: [/\bsql\b/i, /\bmysql\b/i, /\bpostgresql\b/i, /\bpostgres\b/i, /\bsqlite\b/i, /\brdbms\b/i] },
  { name: 'MongoDB', patterns: [/\bmongodb\b/i, /\bmongo\b/i, /\bnosql\b/i] },
  { name: 'HTML & CSS', patterns: [/\bhtml5?\b/i, /\bcss3?\b/i, /\btailwind(?:\s*css)?\b/i, /\bbootstrap\b/i] },
  { name: 'Git', patterns: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i] },
  { name: 'AWS', patterns: [/\baws\b/i, /\bamazon web services\b/i, /\bec2\b/i, /\bs3\b/i, /\blambda\b/i] },
  { name: 'Docker', patterns: [/\bdocker\b/i, /\bkubernetes\b/i, /\bk8s\b/i, /\bcontainers?\b/i] },
  { name: 'Data Structures & Algorithms', patterns: [/\bdata structures\b/i, /\balgorithms\b/i, /\bdsa\b/i] },
  { name: 'Machine Learning', patterns: [/\bmachine learning\b/i, /\bdeep learning\b/i, /\bdata science\b/i, /\bartificial intelligence\b/i] },
  { name: 'Linux', patterns: [/\blinux\b/i, /\bunix\b/i, /\bbash\b/i, /\bshell scripting\b/i] },
  { name: 'PHP', patterns: [/\bphp\b/i, /\blaravel\b/i] },
  { name: 'Angular', patterns: [/\bangular(?:\.js|js)?\b/i] },
  { name: 'Vue.js', patterns: [/\bvue(?:\.js|js)?\b/i] },
  { name: 'Next.js', patterns: [/\bnext(?:\.js|js)?\b/i] },
  { name: 'REST API', patterns: [/\brest\s*apis?\b/i, /\brestful\b/i] },
  { name: 'MS Office', patterns: [/\bms office\b/i, /\bexcel\b/i, /\bword\b/i, /\bpowerpoint\b/i] },
  { name: 'Problem Solving', patterns: [/\bproblem solving\b/i, /\banalytical skills\b/i] },
];

// Department keywords mapping
const DEPARTMENTS = [
  { name: 'Computer Science', patterns: [/\bcomputer science\b/i, /\bcomputer engineering\b/i, /\bcse\b/i] },
  { name: 'Information Technology', patterns: [/\binformation technology\b/i, /\bit\b/i] },
  { name: 'Electronics & Communication', patterns: [/\belectronics\b/i, /\bece\b/i, /\bcommunication engineering\b/i] },
  { name: 'Electrical Engineering', patterns: [/\belectrical\b/i, /\beee\b/i] },
  { name: 'Mechanical Engineering', patterns: [/\bmechanical\b/i, /\bmech\b/i] },
  { name: 'Civil Engineering', patterns: [/\bcivil\b/i] },
];

/**
 * Extracts plain text from a PDF Buffer
 */
export const extractTextFromPdfBuffer = async (buffer) => {
  try {
    const uint8 = new Uint8Array(buffer);
    const parser = new pdfParse.PDFParse(uint8);
    const result = await parser.getText();
    return result?.text || String(result || '');
  } catch (err) {
    console.error('[ResumeParser] PDF parsing error:', err.message);
    throw new Error('Could not parse text from uploaded resume PDF. Please ensure the file is a standard PDF document.');
  }
};

/**
 * Parses resume text into structured student profile fields
 */
export const parseResumeText = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      skills: [],
      phone: '',
      email: '',
      cgpa: null,
      tenthPercentage: null,
      twelfthPercentage: null,
      department: '',
      githubUrl: '',
      linkedinUrl: '',
    };
  }

  const cleanText = text.replace(/\r\n/g, '\n');

  // 1. Extract Technical Skills
  const extractedSkills = [];
  for (const skill of SKILLS_CATALOG) {
    const matched = skill.patterns.some((p) => p.test(cleanText));
    if (matched && !extractedSkills.includes(skill.name)) {
      extractedSkills.push(skill.name);
    }
  }

  // 2. Extract Phone Number (Standard 10-digit Indian mobile formats with optional +91 or dashes)
  let phone = '';
  const phoneMatch = cleanText.match(/(?:mobile|phone|contact|tel)?[:\s-]*(\+?91[\s-]?)?([6-9]\d{9})\b/i);
  if (phoneMatch && phoneMatch[2]) {
    phone = phoneMatch[2];
  }

  // 3. Extract Email
  let email = '';
  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch && emailMatch[1]) {
    email = emailMatch[1].trim();
  }

  // 4. Extract Social Links (GitHub, LinkedIn)
  let githubUrl = '';
  const githubMatch = cleanText.match(/(https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+|github\.com\/[a-zA-Z0-9_.-]+)/i);
  if (githubMatch) {
    githubUrl = githubMatch[1].startsWith('http') ? githubMatch[1] : `https://${githubMatch[1]}`;
  }

  let linkedinUrl = '';
  const linkedinMatch = cleanText.match(/(https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+|linkedin\.com\/in\/[a-zA-Z0-9_.-]+)/i);
  if (linkedinMatch) {
    linkedinUrl = linkedinMatch[1].startsWith('http') ? linkedinMatch[1] : `https://${linkedinMatch[1]}`;
  }

  // 5. Extract CGPA (e.g. "CGPA: 8.88", "8.88 / 10", "8.75 CGPA")
  let cgpa = null;
  const cgpaMatch = cleanText.match(/(?:cgpa|gpa|cumulative grade|cumulative point)[:\s]*([0-9]\.[0-9]{1,2})\b/i) ||
                    cleanText.match(/\b([0-9]\.[0-9]{1,2})\s*(?:\/\s*10|cgpa)/i);
  if (cgpaMatch && cgpaMatch[1]) {
    const parsed = parseFloat(cgpaMatch[1]);
    if (parsed >= 0 && parsed <= 10) {
      cgpa = parsed;
    }
  }

  // 6. Extract 10th / SSC Percentage (support multiline / tabular layouts)
  let tenthPercentage = null;
  const sscMatch = cleanText.match(/(?:ssc|10th|matriculation|secondary)[\s\S]{0,250}?([0-9]{2}(?:\.[0-9]{1,2})?)\s*%/i) ||
                   cleanText.match(/([0-9]{2}(?:\.[0-9]{1,2})?)\s*%[\s\S]{0,250}?(?:ssc|10th|matriculation)/i);
  if (sscMatch && sscMatch[1]) {
    const val = parseFloat(sscMatch[1]);
    if (val >= 35 && val <= 100) tenthPercentage = val;
  }

  // 7. Extract 12th / Inter / Diploma Percentage (support multiline / tabular layouts)
  let twelfthPercentage = null;
  const interMatch = cleanText.match(/(?:diploma|intermediate|12th|inter|higher secondary|puc)[\s\S]{0,250}?([0-9]{2}(?:\.[0-9]{1,2})?)\s*%/i) ||
                     cleanText.match(/([0-9]{2}(?:\.[0-9]{1,2})?)\s*%[\s\S]{0,250}?(?:diploma|intermediate|12th|puc)/i);
  if (interMatch && interMatch[1]) {
    const val = parseFloat(interMatch[1]);
    if (val >= 35 && val <= 100) twelfthPercentage = val;
  }

  // 8. Extract Department / Branch
  let department = '';
  for (const dept of DEPARTMENTS) {
    const matched = dept.patterns.some((p) => p.test(cleanText));
    if (matched) {
      department = dept.name;
      break;
    }
  }

  return {
    skills: extractedSkills,
    phone,
    email,
    cgpa,
    tenthPercentage,
    twelfthPercentage,
    department,
    githubUrl,
    linkedinUrl,
  };
};

export default {
  extractTextFromPdfBuffer,
  parseResumeText,
};
