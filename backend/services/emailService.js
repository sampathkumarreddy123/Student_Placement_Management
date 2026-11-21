import nodemailer from 'nodemailer';

/**
 * Centrally Configured Email Service for MITS Placement Management Portal
 *
 * Requirements Met:
 * - Operates independently of which Placement Officer is logged in.
 * - One centrally configured and authorized MITS sender address.
 * - Supports Microsoft 365 OAuth 2.0 (institutional modern auth) and SMTP AUTH.
 * - Supports both EMAIL_* and SMTP_* environment variable naming conventions.
 * - Safe error handling: never exposes tokens, credentials, or falsely claims delivery.
 * - Provides clean, responsive HTML email templates with university branding.
 */

let cachedTransporter = null;

/**
 * Resolves the production or local frontend URL for emails.
 * Always ensures links sent to student mailboxes open the live web app rather than an unreachable localhost.
 */
export const getFrontendBaseUrl = () => {
  const envUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  // If explicitly configured to an external live domain, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }
  // In production, on Render, or if running live, use production Vercel frontend URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.RENDER_EXTERNAL_URL) {
    return 'https://student-placement-management-portal.vercel.app';
  }
  // For emails dispatched to real student inboxes, default to verified production Vercel portal so links open on phones & laptops
  return 'https://student-placement-management-portal.vercel.app';
};

/**
 * Sanitizes URLs passed to email buttons to never contain broken localhost addresses
 */
export const sanitizePortalUrl = (url, defaultPath = '/student/applications') => {
  const baseUrl = getFrontendBaseUrl();
  if (!url) return `${baseUrl}${defaultPath}`;
  if (url.startsWith('http://localhost:5173') || url.startsWith('http://127.0.0.1:5173')) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):5173/, baseUrl);
  }
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return url;
};

/**
 * Resolves the centralized sender address and display name
 */
export const getSenderDetails = (officer = null) => {
  const defaultFromName =
    process.env.FROM_NAME ||
    process.env.EMAIL_FROM_NAME ||
    'MITS Placement Cell';

  const defaultFromAddress =
    process.env.FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    '25695a0545@mits.ac.in';

  if (officer?.name && officer?.email) {
    return {
      fromName: `${officer.name} (MITS Placement Cell)`,
      fromAddress: defaultFromAddress,
      fromHeader: `"${officer.name} (MITS Placement Cell)" <${defaultFromAddress}>`,
      replyTo: `"${officer.name}" <${officer.email}>`,
      officerName: officer.name,
      officerEmail: officer.email,
    };
  }

  return {
    fromName: defaultFromName,
    fromAddress: defaultFromAddress,
    fromHeader: `"${defaultFromName}" <${defaultFromAddress}>`,
    replyTo: defaultFromAddress,
    officerName: null,
    officerEmail: null,
  };
};

/**
 * Initializes and caches the central Nodemailer transporter
 */
export const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser =
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    '25695a0545@mits.ac.in';
  const emailPassword =
    process.env.EMAIL_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    'Sampath317.';
  const emailHost =
    process.env.EMAIL_HOST ||
    process.env.SMTP_HOST ||
    'smtp.office365.com';
  const emailPort =
    Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
  const emailSecure =
    process.env.EMAIL_SECURE === 'true' ||
    process.env.SMTP_SECURE === 'true' ||
    emailPort === 465;

  // 1. Check for Microsoft 365 OAuth 2.0 (Azure AD / Entra ID Modern Auth)
  const oauthClientId =
    process.env.M365_CLIENT_ID ||
    process.env.AZURE_CLIENT_ID ||
    process.env.OAUTH_CLIENT_ID;

  if (oauthClientId && emailUser) {
    const oauthClientSecret =
      process.env.M365_CLIENT_SECRET ||
      process.env.AZURE_CLIENT_SECRET ||
      process.env.OAUTH_CLIENT_SECRET;
    const oauthRefreshToken =
      process.env.M365_REFRESH_TOKEN ||
      process.env.AZURE_REFRESH_TOKEN ||
      process.env.OAUTH_REFRESH_TOKEN;
    const oauthTenantId =
      process.env.M365_TENANT_ID ||
      process.env.AZURE_TENANT_ID ||
      'common';

    cachedTransporter = nodemailer.createTransport({
      host: emailHost || 'smtp.office365.com',
      port: emailPort,
      secure: false, // Office365 uses STARTTLS on 587
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      auth: {
        type: 'OAuth2',
        user: emailUser,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        refreshToken: oauthRefreshToken,
        tenantId: oauthTenantId,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });

    console.log(`[Email Service] Configured Microsoft 365 OAuth 2.0 relay for: ${emailUser}`);
    return cachedTransporter;
  }

  // 2. Standard SMTP Relay (MITS authorized SMTP / Office 365 SMTP / Gmail / Brevo / Campus Server)
  if (emailHost && emailUser && emailPassword) {
    cachedTransporter = nodemailer.createTransport({
      pool: true, // Keep persistent pooled connection for sub-3-second delivery
      maxConnections: 5,
      maxMessages: 100,
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log(`[Email Service] Configured central pooled SMTP transport: ${emailHost}:${emailPort} (${emailUser})`);
    return cachedTransporter;
  }

  // 3. Service Presets (e.g. EMAIL_SERVICE=gmail)
  if (process.env.EMAIL_SERVICE && emailUser && emailPassword) {
    cachedTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    console.log(`[Email Service] Configured service preset: ${process.env.EMAIL_SERVICE} (${emailUser})`);
    return cachedTransporter;
  }

  // 4. Local Development Fallback: Ethereal mock inbox or JSON transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      `[Email Service] Running in development mode without external SMTP. Configured mock Ethereal inbox: ${testAccount.user}`
    );
    return cachedTransporter;
  } catch (err) {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.warn('[Email Service] Running in offline JSON transport mode.');
    return cachedTransporter;
  }
};

/**
 * Responsive HTML Template Generator with MITS Branding
 */
const buildEmailHtml = ({
  title,
  preheader = '',
  greeting = 'Hello',
  paragraphs = [],
  highlightBox = null,
  actionButton = null,
  fallbackUrl = null,
  securityNotice = null,
  expiryNotice = null,
}) => {
  const portalUrl = getFrontendBaseUrl();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #EFF6FF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #172554;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background: #FFFFFF;
      border: 1px solid #DBEAFE;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(22, 58, 95, 0.05);
    }
    .header-bar {
      background-color: #163A5F;
      padding: 24px 32px;
      text-align: left;
    }
    .header-logo {
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 12px;
      color: #93C5FD;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .content-body {
      padding: 32px 32px 24px 32px;
    }
    .email-title {
      font-size: 18px;
      font-weight: 700;
      color: #172554;
      margin: 0 0 16px 0;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #172554;
      margin: 0 0 14px 0;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 14px 0;
    }
    .highlight-card {
      background-color: #EFF6FF;
      border: 1px solid #DBEAFE;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .highlight-item {
      font-size: 13px;
      line-height: 1.6;
      color: #1E293B;
      margin: 4px 0;
    }
    .highlight-label {
      font-weight: 600;
      color: #163A5F;
      min-width: 130px;
      display: inline-block;
    }
    .btn-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn-action {
      background-color: #2563EB;
      color: #FFFFFF !important;
      padding: 13px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
    }
    .fallback-card {
      background-color: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 12px;
      color: #64748B;
      word-break: break-all;
      line-height: 1.5;
    }
    .notice-box {
      border-left: 4px solid #2563EB;
      background-color: #F8FAFC;
      padding: 12px 16px;
      margin: 18px 0;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .security-box {
      border-left: 4px solid #D97706;
      background-color: #FEF3C7;
      padding: 12px 16px;
      margin: 18px 0;
      font-size: 12px;
      color: #92400E;
      line-height: 1.5;
      border-radius: 0 6px 6px 0;
    }
    .footer-bar {
      background-color: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.6;
    }
    .footer-bar a {
      color: #2563EB;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:1px;color:#EFF6FF;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <div class="email-container">
    <div class="header-bar">
      <div class="header-logo">CampusPlacement Portal</div>
      <div class="header-subtitle">Madanapalle Institute of Technology &amp; Science (MITS) &bull; Placement Cell</div>
    </div>
    <div class="content-body">
      <h1 class="email-title">${title}</h1>
      <div class="greeting">${greeting},</div>
      
      ${paragraphs.map((p) => `<p class="paragraph">${p}</p>`).join('')}

      ${
        highlightBox
          ? `
          <div class="highlight-card">
            ${Object.entries(highlightBox)
              .map(
                ([key, value]) => `
              <div class="highlight-item">
                <span class="highlight-label">${key}:</span>
                <span><strong>${value}</strong></span>
              </div>
            `
              )
              .join('')}
          </div>
        `
          : ''
      }

      ${
        actionButton
          ? `
        <div class="btn-container">
          <a href="${actionButton.url}" class="btn-action" target="_blank" rel="noopener noreferrer">${actionButton.text}</a>
        </div>
      `
          : ''
      }

      ${
        expiryNotice
          ? `
        <div class="notice-box">
          <strong>Important:</strong> ${expiryNotice}
        </div>
      `
          : ''
      }

      ${
        fallbackUrl
          ? `
        <div class="fallback-card">
          If the button above does not work, copy and paste this link into your web browser:<br>
          <a href="${fallbackUrl}" style="color:#2563EB;word-break:break-all;">${fallbackUrl}</a>
        </div>
      `
          : ''
      }

      ${
        securityNotice
          ? `
        <div class="security-box">
          <strong>Security Notice:</strong> ${securityNotice}
        </div>
      `
          : ''
      }
    </div>
    <div class="footer-bar">
      <p style="margin:0 0 6px 0;">This is an automated system email sent from the MITS Student Placement Portal.</p>
      <p style="margin:0 0 6px 0;">Please do not reply directly to this automated address. For assistance, contact the <a href="mailto:placement@mits.ac.in">Placement Cell</a>.</p>
      <p style="margin:0;font-size:11px;color:#94A3B8;">&copy; ${new Date().getFullYear()} Madanapalle Institute of Technology &amp; Science. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Base email dispatcher: executes sendMail safely and returns info or throws
 */
export const sendEmail = async ({ to, subject, text, html, officer = null }) => {
  if (!to) {
    throw new Error('Recipient email address is required.');
  }

  let transporter = await getTransporter();
  const { fromHeader, replyTo } = getSenderDetails(officer);

  const mailOptions = {
    from: fromHeader,
    replyTo: replyTo || fromHeader,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Delivered email "${subject}" to ${to} (MessageID: ${info.messageId || 'OK'})`);
    return info;
  } catch (err) {
    console.warn(`[Email Service Warning] sendMail failed (${err.message}), clearing cached transporter pool.`);
    cachedTransporter = null;
    throw err;
  }

  // If in development using test accounts, log the preview URL for immediate testing
  if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] Development Preview URL: ${previewUrl}`);
    }
  }

  return info;
};

/**
 * 1. Student Account Verification Email
 */
export const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const subject = 'Verify Your College Email - MITS Placement Portal';
  const text = `Hello ${name},\n\nThank you for registering on the MITS Student Placement Management Portal.\nPlease verify your college email address by opening the following link:\n${verifyUrl}\n\nThis verification link expires in 24 hours.\nYou must verify your email before applying for placement drives.\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: 'Verify Your College Email Address',
    preheader: 'Complete your registration to unlock placement drives.',
    greeting: `Hello ${name}`,
    paragraphs: [
      'Thank you for registering on the official <strong>MITS Student Placement Management Portal</strong>.',
      'To activate your student profile, verify your institutional identity, and unlock placement drives, please confirm your college email address by clicking below.',
    ],
    actionButton: {
      text: 'Verify College Email',
      url: verifyUrl,
    },
    fallbackUrl: verifyUrl,
    expiryNotice: 'This verification link is single-use and will expire in 24 hours.',
    securityNotice:
      'If you did not register for an account on the MITS Placement Portal, please disregard this email.',
  });

  return await sendEmail({ to, subject, text, html });
};

/**
 * 2. Student Forgot Password / Reset Password Email
 * Strictly implements 15-minute expiration, single-use notice, and security notice
 */
export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
  expiresInMinutes = 15,
}) => {
  const subject = 'Password Reset Request - MITS Placement Portal';
  const text = `Hello ${name},\n\nA password reset request was submitted for your MITS Placement Portal account.\nPlease visit the following link to set a new password:\n${resetUrl}\n\nThis password reset link is strictly valid for ${expiresInMinutes} minutes and can only be used once.\n\nSecurity Notice:\nIf you did not make this request, please disregard this message or notify the Placement Cell if you suspect unauthorized access. Your current password remains safe.\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: 'Password Reset Request',
    preheader: `Secure password reset link valid for ${expiresInMinutes} minutes.`,
    greeting: `Hello ${name}`,
    paragraphs: [
      'We received a request to reset the password associated with your MITS Student Placement Portal account.',
      'Click the button below to choose a new password. For security, this link can only be used once.',
    ],
    actionButton: {
      text: 'Reset Password',
      url: resetUrl,
    },
    fallbackUrl: resetUrl,
    expiryNotice: `This password reset link expires in <strong>${expiresInMinutes} minutes</strong> and is strictly single-use.`,
    securityNotice:
      'If you did not request this password reset, no action is needed on your part. Your existing password remains secure and unchanged. If you suspect unauthorized activity, contact the Placement Cell immediately.',
  });

  return await sendEmail({ to, subject, text, html });
};

/**
 * 3. Password Reset Confirmation Email
 */
export const sendPasswordResetConfirmationEmail = async ({
  to,
  name,
  resetTime,
}) => {
  const portalUrl = getFrontendBaseUrl();
  const loginUrl = `${portalUrl}/student/login`;

  const subject = 'Password Successfully Changed - MITS Placement Portal';
  const text = `Hello ${name},\n\nYour password for the MITS Placement Portal was successfully changed on ${resetTime || 'recently'}.\nIf you initiated this change, no further action is required.\n\nIf you did NOT change your password, please contact the Placement Office immediately.\n\nLogin URL: ${loginUrl}\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: 'Password Successfully Changed',
    preheader: 'Your portal account password has been updated.',
    greeting: `Hello ${name}`,
    paragraphs: [
      `Your password for the <strong>MITS Student Placement Management Portal</strong> was successfully changed on <strong>${
        resetTime || new Date().toLocaleString()
      }</strong>.`,
      'You can now sign in to your student account using your new credentials.',
    ],
    actionButton: {
      text: 'Sign In to Portal',
      url: loginUrl,
    },
    securityNotice:
      'If you did not make this change, your account may be compromised. Please contact the MITS Placement Administration Office immediately to secure your credentials.',
  });

  return await sendEmail({ to, subject, text, html });
};

/**
 * 4. Student Application Confirmation Email
 */
export const sendApplicationSubmittedEmail = async ({
  to,
  name,
  companyName,
  jobRole,
  packageLPA,
  portalUrl,
}) => {
  const finalPortalUrl = sanitizePortalUrl(portalUrl, '/student/applications');
  const subject = `Application Confirmed: ${companyName} (${jobRole})`;
  const text = `Hello ${name},\n\nYour application for "${jobRole}" at ${companyName} has been submitted successfully.\nPackage: ${packageLPA ? `₹${packageLPA} LPA` : 'As per company policy'}\nStatus: Under Review\n\nYou can track the progress of your application in your student portal: ${finalPortalUrl}\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: 'Application Submitted Successfully',
    preheader: `Your application for ${companyName} has been received.`,
    greeting: `Hello ${name}`,
    paragraphs: [
      `Your application for the <strong>${jobRole}</strong> position at <strong>${companyName}</strong> has been received and is now officially under review by the placement committee and recruiter.`,
    ],
    highlightBox: {
      Company: companyName,
      'Job Role': jobRole,
      'Package / CTC': packageLPA ? `₹${packageLPA} LPA` : 'Negotiable / Standard',
      'Initial Status': 'Under Review',
      'Submission Date': new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    actionButton: {
      text: 'Track Application Status',
      url: finalPortalUrl,
    },
  });

  return await sendEmail({ to, subject, text, html });
};

/**
 * 5. Application Status Update Email (Shortlisted, Rejected, Interview Round, Selected)
 */
export const sendApplicationStatusUpdateEmail = async ({
  to,
  name,
  companyName,
  jobRole,
  newStatus,
  remarks,
  roundName,
  interviewDetails,
  portalUrl,
  officer,
  timestamp,
}) => {
  const finalPortalUrl = sanitizePortalUrl(portalUrl, '/student/applications');
  const officerName = officer?.name || 'MITS Placement Officer';
  const officerEmail = officer?.email || '25695a0545@mits.ac.in';

  const statusStr = String(newStatus || 'Status Updated').trim();
  const isRejected = /reject/i.test(statusStr);
  const isShortlisted = /shortlist/i.test(statusStr);
  const isSelected = /select/i.test(statusStr);
  const isUnderReview = /review/i.test(statusStr);
  const isInterviewing = /interview/i.test(statusStr) || Boolean(roundName);

  let statusLabel = statusStr;
  let subject = `Application Update: ${statusStr} – ${companyName}`;
  let title = `Application Status: ${statusStr}`;
  let preheader = `Status update for ${jobRole} at ${companyName}.`;
  let paragraphs = [
    `There is an official update regarding your campus placement application for <strong>${jobRole}</strong> at <strong>${companyName}</strong>.`,
    `Your recruitment status has been updated to <strong>${statusStr}</strong> by Placement Officer <strong>${officerName}</strong>.`,
  ];

  if (isRejected) {
    statusLabel = 'Rejected (Not Shortlisted)';
    subject = `Application Update: Not Shortlisted / Rejected – ${companyName}`;
    title = `Application Status: Rejected`;
    preheader = `Important update regarding your placement application at ${companyName}.`;
    paragraphs = [
      `Thank you for participating in the campus placement evaluation process for <strong>${jobRole}</strong> at <strong>${companyName}</strong>.`,
      `We regret to inform you that your application has not been shortlisted / advanced to the next round. Your recruitment status has officially been marked as <strong>Rejected</strong> by Placement Officer <strong>${officerName}</strong>.`,
      `We encourage you to review the feedback provided, continue preparing your technical skillset, and apply for other active campus drives on the portal.`,
    ];
  } else if (isSelected) {
    statusLabel = 'Selected / Placed';
    subject = `Congratulations! You Have Been Selected – ${companyName}`;
    title = `🎉 Selected at ${companyName}!`;
    preheader = `Formal placement offer for ${jobRole} at ${companyName}.`;
    paragraphs = [
      `On behalf of the <strong>MITS Placement Cell</strong>, we are thrilled to congratulate you on your official selection for <strong>${jobRole}</strong> at <strong>${companyName}</strong>!`,
      `This placement offer has been confirmed by Placement Officer <strong>${officerName}</strong>.`,
    ];
  } else if (isShortlisted) {
    statusLabel = 'Shortlisted';
    subject = `Application Update: Shortlisted – ${companyName}`;
    title = `🎉 Congratulations! You are Shortlisted`;
    preheader = `Congratulations! You have been shortlisted for ${companyName}.`;
    paragraphs = [
      `Congratulations! We are pleased to notify you that your application for <strong>${jobRole}</strong> at <strong>${companyName}</strong> has been officially <strong>Shortlisted</strong> by Placement Officer <strong>${officerName}</strong>.`,
      `You are eligible to participate in the upcoming recruitment rounds. Please check your student placement portal for round schedule, guidelines, and interview instructions.`,
    ];
  } else if (isInterviewing) {
    statusLabel = roundName ? `${roundName} Scheduled` : 'Interviewing';
    subject = `Application Update: ${roundName || 'Technical Interview'} Scheduled – ${companyName}`;
    title = `Application Status: ${roundName || 'Interview Scheduled'}`;
    preheader = `Interview round scheduled for ${companyName}.`;
    paragraphs = [
      `An interview round has been scheduled for your application for <strong>${jobRole}</strong> at <strong>${companyName}</strong>.`,
    ];
    if (interviewDetails?.date || interviewDetails?.venue) {
      paragraphs.push(
        `<strong>Interview Details:</strong><br/>` +
        (interviewDetails.date ? `Date & Time: ${new Date(interviewDetails.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}<br/>` : '') +
        (interviewDetails.venue ? `Venue / Link: ${interviewDetails.venue}<br/>` : '') +
        (interviewDetails.description ? `Instructions: ${interviewDetails.description}` : '')
      );
    }
  } else if (isUnderReview) {
    statusLabel = 'Under Review';
    subject = `Application Update: Under Review – ${companyName}`;
    title = `Application Status: Under Review`;
    preheader = `Your application for ${companyName} is under review.`;
    paragraphs = [
      `Your application for <strong>${jobRole}</strong> at <strong>${companyName}</strong> is currently being reviewed by the placement committee and recruiter.`,
    ];
  }

  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const formattedDate = dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const highlightBox = {
    Company: companyName,
    'Job Role': jobRole,
    'Recruitment Status': statusLabel,
    'Updated By Officer': `${officerName} (${officerEmail})`,
    ...(roundName ? { 'Interview Round': roundName } : {}),
    ...(interviewDetails?.date
      ? {
          'Interview Date & Time': new Date(interviewDetails.date).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }
      : {}),
    ...(interviewDetails?.venue ? { 'Venue / Meeting Link': interviewDetails.venue } : {}),
    ...(remarks ? { 'Officer Remarks / Feedback': remarks } : {}),
    'Updated On': formattedDate,
  };

  const text = `Hello ${name},\n\nYour application for "${jobRole}" at ${companyName} has been updated.\nStatus: ${statusLabel}\n${remarks ? `Officer Remarks: ${remarks}\n` : ''}${roundName ? `Round: ${roundName}\n` : ''}Updated by: ${officerName} (${officerEmail})\nUpdated On: ${formattedDate}\nView details on the student portal: ${finalPortalUrl}\n\nBest regards,\n${officerName}\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title,
    preheader,
    greeting: `Hello ${name}`,
    paragraphs,
    highlightBox,
    actionButton: {
      text: 'View Application Details',
      url: finalPortalUrl,
    },
  });

  return await sendEmail({ to, subject, text, html, officer });
};

/**
 * 6. Placement Drive Announcement Email
 */
export const sendDriveAnnouncementEmail = async ({
  to,
  name,
  companyName,
  jobRole,
  packageLPA,
  deadline,
  portalUrl,
}) => {
  const finalPortalUrl = sanitizePortalUrl(portalUrl, '/student/drives');
  const subject = `New Placement Drive: ${companyName} (${jobRole})`;
  const text = `Hello ${name},\n\nA new campus placement drive has been announced by ${companyName} for "${jobRole}".\nPackage: ${packageLPA ? `₹${packageLPA} LPA` : 'Competitive'}\nDeadline: ${deadline || 'Check portal'}\n\nPlease check eligibility and apply through your student dashboard: ${finalPortalUrl}\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: `New Campus Recruitment Drive: ${companyName}`,
    preheader: `${companyName} is hiring for ${jobRole}.`,
    greeting: `Hello ${name}`,
    paragraphs: [
      `A new on-campus placement opportunity has been published by <strong>${companyName}</strong> for eligible graduating students.`,
      'Review the job description, eligibility criteria, and drive schedule, then submit your application before the deadline.',
    ],
    highlightBox: {
      Company: companyName,
      'Job Role': jobRole,
      'Package / CTC': packageLPA ? `₹${packageLPA} LPA` : 'As per industry standard',
      ...(deadline ? { 'Registration Deadline': deadline } : {}),
    },
    actionButton: {
      text: 'View Drive & Apply Now',
      url: finalPortalUrl,
    },
  });

  return await sendEmail({ to, subject, text, html });
};

/**
 * 7. Selection / Job Offer Extended Email
 */
export const sendSelectionOfferEmail = async ({
  to,
  name,
  companyName,
  jobRole,
  packageLPA,
  remarks,
  portalUrl,
  officer,
}) => {
  const finalPortalUrl = sanitizePortalUrl(portalUrl, '/student/applications');
  const officerName = officer?.name || 'MITS Placement Officer';
  const officerEmail = officer?.email || '25695a0545@mits.ac.in';

  const subject = `🎉 Congratulations! Selected for ${jobRole} at ${companyName}`;
  const text = `Congratulations ${name}!\n\nYou have been selected for the position of "${jobRole}" at ${companyName} with an offered CTC of ₹${packageLPA || ''} LPA.\n${remarks ? `Officer Remarks: ${remarks}\n` : ''}Updated by: ${officerName} (${officerEmail})\nPlease visit the placement portal for formal documentation: ${finalPortalUrl}\n\nWarm regards,\n${officerName}\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title: `🎉 Congratulations on Your Selection at ${companyName}!`,
    preheader: `Formal placement offer for ${jobRole} at ${companyName}.`,
    greeting: `Dear ${name}`,
    paragraphs: [
      `On behalf of the <strong>MITS Placement Cell</strong>, we are thrilled to congratulate you on your official selection for the <strong>${jobRole}</strong> role at <strong>${companyName}</strong>!`,
      `This offer was officially confirmed by Placement Officer <strong>${officerName}</strong>. Please check the placement portal for round clearance records and instructions regarding formal offer letters.`,
    ],
    highlightBox: {
      Company: companyName,
      'Designation / Role': jobRole,
      'Offered Package': packageLPA ? `₹${packageLPA} LPA` : 'Confirmed Offer',
      Status: 'Selected / Placed',
      'Confirmed By Officer': `${officerName} (${officerEmail})`,
      ...(remarks ? { 'Recruiter / Officer Remarks': remarks } : {}),
    },
    actionButton: {
      text: 'View Offer in Placement Portal',
      url: finalPortalUrl,
    },
  });

  return await sendEmail({ to, subject, text, html, officer });
};

/**
 * 8. Generic Automated Portal Notification Email
 */
export const sendGenericNotificationEmail = async ({
  to,
  name,
  title,
  message,
  portalUrl,
}) => {
  const finalPortalUrl = sanitizePortalUrl(portalUrl, '/student/dashboard');
  const subject = `${title} - MITS Placement Portal`;
  const text = `Hello ${name},\n\n${title}\n\n${message}\n\nPortal: ${finalPortalUrl}\n\nBest regards,\nMITS Placement Cell`;

  const html = buildEmailHtml({
    title,
    preheader: title,
    greeting: `Hello ${name}`,
    paragraphs: [message],
    actionButton: finalPortalUrl
      ? {
          text: 'Open Placement Portal',
          url: finalPortalUrl,
        }
      : null,
  });

  return await sendEmail({ to, subject, text, html });
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendApplicationSubmittedEmail,
  sendApplicationStatusUpdateEmail,
  sendDriveAnnouncementEmail,
  sendSelectionOfferEmail,
  sendGenericNotificationEmail,
  getTransporter,
  getSenderDetails,
};
