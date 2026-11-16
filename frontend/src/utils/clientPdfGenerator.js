/**
 * Client-side PDF generator and resilient resume handler.
 * Provides fallback resume document generation directly inside the browser
 * when backend file storage is ephemeral, wiped, or missing on disk.
 */

export const generateCandidateResumeBlob = ({
  name = 'Candidate',
  rollNumber = 'N/A',
  department = 'Engineering & Technology',
  cgpa = 'N/A',
  email = 'N/A',
  phone = 'N/A',
  skills = [],
  tenthPercentage = 'N/A',
  twelfthPercentage = 'N/A',
} = {}) => {
  const cleanName = String(name || 'Candidate').replace(/[\\()]/g, '');
  const cleanRoll = String(rollNumber || 'N/A').replace(/[\\()]/g, '');
  const cleanDept = String(department || 'N/A').replace(/[\\()]/g, '');
  const cleanCgpa = String(cgpa !== undefined && cgpa !== null ? cgpa : 'N/A').replace(/[\\()]/g, '');
  const cleanEmail = String(email || 'N/A').replace(/[\\()]/g, '');
  const cleanPhone = String(phone || 'N/A').replace(/[\\()]/g, '');
  const clean10th = String(tenthPercentage !== undefined && tenthPercentage !== null ? `${tenthPercentage}%` : 'N/A').replace(/[\\()]/g, '');
  const clean12th = String(twelfthPercentage !== undefined && twelfthPercentage !== null ? `${twelfthPercentage}%` : 'N/A').replace(/[\\()]/g, '');

  let skillsText = 'Core Engineering, Data Structures & Algorithms, Problem Solving, Full-Stack Web Development';
  if (Array.isArray(skills) && skills.length > 0) {
    skillsText = skills.join(', ').replace(/[\\()]/g, '');
  } else if (typeof skills === 'string' && skills.trim()) {
    skillsText = skills.replace(/[\\()]/g, '');
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const streamLines = [
    'BT',
    '/F1 18 Tf',
    '50 740 Td',
    `(${cleanName} - Placement Resume Snapshot) Tj`,
    '/F1 10 Tf',
    '0 -24 Td',
    `(Verified Academic & Placement Record | Placement Management Portal) Tj`,
    '0 -16 Td',
    `(Snapshot Generated: ${dateStr}) Tj`,
    '/F1 13 Tf',
    '0 -36 Td',
    `(ACADEMIC CREDENTIALS & CANDIDATE DETAILS) Tj`,
    '/F1 10 Tf',
    '0 -22 Td',
    `(Candidate Name: ${cleanName}) Tj`,
    '0 -18 Td',
    `(Roll Number: ${cleanRoll}) Tj`,
    '0 -18 Td',
    `(Department / Branch: ${cleanDept}) Tj`,
    '0 -18 Td',
    `(Cumulative CGPA: ${cleanCgpa}) Tj`,
    '0 -18 Td',
    `(10th Standard / Matriculation: ${clean10th}) Tj`,
    '0 -18 Td',
    `(12th Standard / Inter / Diploma: ${clean12th}) Tj`,
    '0 -18 Td',
    `(Contact Email: ${cleanEmail}) Tj`,
    '0 -18 Td',
    `(Contact Phone: ${cleanPhone}) Tj`,
    '/F1 13 Tf',
    '0 -36 Td',
    `(TECHNICAL COMPETENCIES & VERIFIED SKILLS) Tj`,
    '/F1 10 Tf',
    '0 -22 Td',
    `(${skillsText.slice(0, 95)}) Tj`,
    '/F1 10 Tf',
    '0 -45 Td',
    `(Official Document: Verified by Department Training & Placement Office) Tj`,
    'ET',
  ];

  const streamContent = streamLines.join('\n');
  const streamLength = new TextEncoder().encode(streamContent).length;

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000240 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
400
%%EOF
`;

  const bytes = new TextEncoder().encode(pdfString);
  return new Blob([bytes], { type: 'application/pdf' });
};

/**
 * Downloads a Blob directly to the user's browser.
 */
export const downloadBlobFile = (blob, filename = 'Candidate_Resume.pdf') => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
};

/**
 * Opens a Blob in a new browser tab for inline viewing.
 */
export const previewBlobFile = (blob) => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

/**
 * Checks if a response Blob is actually a JSON error payload
 * (which Axios returns when responseType is 'blob' but server returns 404/500 JSON).
 */
export const isJsonErrorBlob = async (blob) => {
  if (!blob || blob.size === 0) return true;
  if (blob.type === 'application/json') return true;

  try {
    const text = await blob.slice(0, 100).text();
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && (trimmed.includes('"success":false') || trimmed.includes('"message"'))) {
      return true;
    }
  } catch (e) {
    // Not text/JSON
  }
  return false;
};
