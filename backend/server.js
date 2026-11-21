import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model imports for auto-recovery
import User from './models/User.js';
import StudentProfile from './models/StudentProfile.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import driveRoutes from './routes/driveRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import roundRoutes from './routes/roundRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resumeIntelligenceRoutes from './routes/resumeIntelligenceRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';
import emailService from './services/emailService.js';
import { startNotificationWorker } from './services/notificationQueueService.js';

// Middleware imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploaded resumes and profile photos (supports both /uploads and /api/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Dynamic resume handler & auto-recovery fallback when files are requested on /uploads/resumes/:filename or /api/uploads/resumes/:filename
app.get(['/uploads/resumes/:filename', '/api/uploads/resumes/:filename'], async (req, res, next) => {
  const { filename } = req.params;
  const resumesDir = path.join(__dirname, 'uploads/resumes');
  const filePath = path.join(resumesDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    if (req.query.download === 'true') {
      return res.download(filePath, filename);
    }
    return res.sendFile(filePath);
  }

  try {
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }

    // Attempt to lookup student by ObjectId if present in filename (e.g. resume-<userId>-timestamp-random.pdf)
    const match = filename.match(/resume-([a-f0-9]{24})/i);
    if (match && match[1]) {
      try {
        const studentProfile = await StudentProfile.findOne({ user: match[1] }).select('+resumeData');
        if (studentProfile && studentProfile.resumeData) {
          const buf = Buffer.from(studentProfile.resumeData, 'base64');
          fs.writeFileSync(filePath, buf);
          res.setHeader('Content-Type', 'application/pdf');
          if (req.query.download === 'true') {
            const dlName = studentProfile.resumeOriginalName || 'Resume.pdf';
            return res.download(filePath, dlName);
          }
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
          return res.sendFile(filePath);
        }
      } catch (dbErr) {
        console.warn('[ResumeRestore] DB lookup skipped:', dbErr.message);
      }
    }

    // Also check by filename match in resumeUrl
    try {
      const sp = await StudentProfile.findOne({ resumeUrl: { $regex: filename } }).select('+resumeData');
      if (sp && sp.resumeData) {
        const buf = Buffer.from(sp.resumeData, 'base64');
        fs.writeFileSync(filePath, buf);
        res.setHeader('Content-Type', 'application/pdf');
        if (req.query.download === 'true') {
          const dlName = sp.resumeOriginalName || 'Resume.pdf';
          return res.download(filePath, dlName);
        }
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
        return res.sendFile(filePath);
      }
    } catch (spErr) {
      console.warn('[ResumeRestore] Filename search error:', spErr.message);
    }

    return res.status(404).json({
      success: false,
      message: 'Original resume document not found on server.',
    });
  } catch (genErr) {
    console.error('[ResumeAutoRecovery Error]', genErr);
    next(genErr);
  }
});

// CORS configuration - support cookies and credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://student-placement-management-portal.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman) or matching origin
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to allow during deployment setup
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-setup-token'],
  })
);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Student Placement Management API',
  });
});

// Diagnostic TCP & SMTP probe endpoint to test Render outbound network
app.get('/api/probe-smtp', async (req, res) => {
  import('net').then(async (net) => {
    import('dns').then(async (dns) => {
      const results = {};
      const start = Date.now();

      // 1. DNS check
      try {
        const addresses = await dns.promises.resolve4('smtp.office365.com');
        results.dns = { success: true, addresses };
      } catch (dnsErr) {
        results.dns = { success: false, error: dnsErr.message };
      }

      // 2. TCP connect check to port 587
      const testPort = (port, host = 'smtp.office365.com') =>
        new Promise((resolve) => {
          const s = Date.now();
          const socket = net.createConnection(port, host);
          socket.setTimeout(8000);
          socket.on('connect', () => {
            const time = Date.now() - s;
            socket.destroy();
            resolve({ port, success: true, latencyMs: time });
          });
          socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, success: false, error: 'TCP connect timeout (8000ms)' });
          });
          socket.on('error', (err) => {
            socket.destroy();
            resolve({ port, success: false, error: err.message });
          });
        });

      results.port587 = await testPort(587);
      results.port25 = await testPort(25);
      results.totalDurationMs = Date.now() - start;

      res.json(results);
    });
  });
});

// Diagnostic live email test endpoint to verify SMTP delivery speed from Render
app.get(['/api/test-email', '/test-email'], async (req, res) => {
  const start = Date.now();
  const targetEmail = req.query.to || '25695a0543@mits.ac.in';
  try {
    const transporter = await emailService.getTransporter();
    const verifyStart = Date.now();
    await transporter.verify();
    const verifyDuration = Date.now() - verifyStart;

    const sendStart = Date.now();
    const info = await emailService.sendApplicationStatusUpdateEmail({
      to: targetEmail,
      name: 'KONANGI SAI LOKESH GOUD',
      companyName: 'Security Test Corp',
      jobRole: 'Software Engineer',
      newStatus: 'Rejected',
      remarks: 'Automated speed benchmark test',
      officer: {
        name: 'T Sampath Kumar Reddy',
        email: '25695a0545@mits.ac.in',
      },
    });
    const sendDuration = Date.now() - sendStart;
    const totalDuration = Date.now() - start;

    res.json({
      success: true,
      targetEmail,
      verifyDurationMs: verifyDuration,
      sendDurationMs: sendDuration,
      totalDurationMs: totalDuration,
      messageId: info?.messageId,
      response: info?.response,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
      command: err.command,
      totalDurationMs: Date.now() - start,
    });
  }
});

// Mount API routes (support both /api/* and root /* endpoints)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', authRoutes); // Fallback router alias for direct auth routes (e.g. /api/security-questions)
app.use('/', authRoutes); // Root fallback router alias

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api/companies', companyRoutes);
app.use('/companies', companyRoutes);

app.use('/api/drives', driveRoutes);
app.use('/drives', driveRoutes);

app.use('/api/applications', applicationRoutes);
app.use('/applications', applicationRoutes);
app.use('/api/application', applicationRoutes);
app.use('/application', applicationRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/rounds', roundRoutes);
app.use('/rounds', roundRoutes);

app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);

app.use('/api/ai-resume', resumeIntelligenceRoutes);
app.use('/ai-resume', resumeIntelligenceRoutes);
app.use('/api/officer/ai-resume', resumeIntelligenceRoutes);

app.use('/api/copilot', copilotRoutes);
app.use('/copilot', copilotRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Placement Management Server running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  // Start durable asynchronous background outbox worker for application status notifications
  try {
    startNotificationWorker();
  } catch (workerErr) {
    console.error('[Server Warning] Could not initialize notification worker:', workerErr.message);
  }
});

export default app;
export { app };

