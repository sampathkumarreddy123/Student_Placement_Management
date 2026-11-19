import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Company from '../models/Company.js';
import OfficerProfile from '../models/OfficerProfile.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper to calculate dynamic profile completion percentage
 */
export const calculateProfileCompletion = (user, profile) => {
  let score = 0;
  const items = [];

  // 1. Basic Info (Name, Email, Roll)
  const hasBasic = Boolean(user.name && user.email && profile.rollNumber);
  items.push({
    key: 'basic',
    label: 'Identification (Name, Email, Roll Number)',
    completed: hasBasic,
    points: 20,
  });
  if (hasBasic) score += 20;

  // 2. Phone Contact
  const hasPhone = Boolean(profile.phone && profile.phone.trim().length >= 8);
  items.push({
    key: 'phone',
    label: 'Contact Phone Number',
    completed: hasPhone,
    points: 10,
  });
  if (hasPhone) score += 10;

  // 3. Department & Batch
  const hasDept = Boolean(profile.department && profile.batch);
  items.push({
    key: 'dept',
    label: 'Department & Graduation Batch',
    completed: hasDept,
    points: 10,
  });
  if (hasDept) score += 10;

  // 4. CGPA
  const hasCgpa = typeof profile.cgpa === 'number' && profile.cgpa > 0;
  items.push({
    key: 'cgpa',
    label: 'Current Academic CGPA',
    completed: hasCgpa,
    points: 15,
  });
  if (hasCgpa) score += 15;

  // 5. Schooling percentages (10th & 12th/Diploma)
  const hasSchooling =
    typeof profile.tenthPercentage === 'number' &&
    profile.tenthPercentage > 0 &&
    typeof profile.twelfthPercentage === 'number' &&
    profile.twelfthPercentage > 0;
  items.push({
    key: 'schooling',
    label: '10th & 12th / Diploma Percentages',
    completed: hasSchooling,
    points: 15,
  });
  if (hasSchooling) score += 15;

  // 6. Skills
  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  items.push({
    key: 'skills',
    label: 'Technical Skills Portfolio',
    completed: hasSkills,
    points: 10,
  });
  if (hasSkills) score += 10;

  // 7. Resume
  const hasResume = Boolean(profile.resumeUrl);
  items.push({
    key: 'resume',
    label: 'PDF Resume Document Uploaded',
    completed: hasResume,
    points: 15,
  });
  if (hasResume) score += 15;

  // 8. Professional links
  const hasSocial = Boolean(profile.linkedinUrl || profile.githubUrl);
  items.push({
    key: 'social',
    label: 'LinkedIn or GitHub Profile Link',
    completed: hasSocial,
    points: 5,
  });
  if (hasSocial) score += 5;

  return {
    percentage: Math.min(score, 100),
    items,
  };
};

// @desc    Get logged-in student profile with completion analysis
// @route   GET /api/users/profile
// @access  Private (Student)
export const getMyProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'placedCompany',
      'name industry website'
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile record not found. Please register through the registration page.',
      });
    }

    const completion = calculateProfileCompletion(req.user, profile);

    res.status(200).json({
      success: true,
      profile: {
        ...profile.toObject(),
        name: req.user.name,
        email: req.user.email,
        isEmailVerified: Boolean(req.user.isEmailVerified),
        profilePhoto: req.user.profilePhoto || profile.profilePhoto || '',
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/users/profile
// @access  Private (Student)
export const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name,
      department,
      batch,
      cgpa,
      activeBacklogs,
      totalBacklogs,
      backlogs,
      tenthPercentage,
      twelfthPercentage,
      phone,
      githubUrl,
      linkedinUrl,
      skills,
      profilePhoto,
    } = req.body;

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    // Validation: CGPA
    if (cgpa !== undefined) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'CGPA must be a valid number between 0 and 10.',
        });
      }
      profile.cgpa = numCgpa;
    }

    // Validation: Percentages
    if (tenthPercentage !== undefined) {
      const num10th = Number(tenthPercentage);
      if (isNaN(num10th) || num10th < 0 || num10th > 100) {
        return res.status(400).json({
          success: false,
          message: '10th percentage must be between 0 and 100.',
        });
      }
      profile.tenthPercentage = num10th;
    }

    if (twelfthPercentage !== undefined) {
      const num12th = Number(twelfthPercentage);
      if (isNaN(num12th) || num12th < 0 || num12th > 100) {
        return res.status(400).json({
          success: false,
          message: '12th / Diploma percentage must be between 0 and 100.',
        });
      }
      profile.twelfthPercentage = num12th;
    }

    // Validation: Backlogs
    if (activeBacklogs !== undefined || backlogs !== undefined) {
      const b = Number(activeBacklogs !== undefined ? activeBacklogs : backlogs);
      if (isNaN(b) || b < 0) {
        return res.status(400).json({
          success: false,
          message: 'Active backlogs cannot be negative.',
        });
      }
      profile.activeBacklogs = b;
      profile.backlogs = b;
    }

    if (totalBacklogs !== undefined) {
      const tb = Number(totalBacklogs);
      if (isNaN(tb) || tb < 0) {
        return res.status(400).json({
          success: false,
          message: 'Total backlogs cannot be negative.',
        });
      }
      profile.totalBacklogs = tb;
    }

    // Validation: URLs
    const urlPattern = /^https?:\/\/.+/i;
    if (githubUrl !== undefined) {
      if (githubUrl && !urlPattern.test(githubUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: 'GitHub profile URL must start with http:// or https://',
        });
      }
      profile.githubUrl = githubUrl ? githubUrl.trim() : '';
    }

    if (linkedinUrl !== undefined) {
      if (linkedinUrl && !urlPattern.test(linkedinUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn profile URL must start with http:// or https://',
        });
      }
      profile.linkedinUrl = linkedinUrl ? linkedinUrl.trim() : '';
    }

    // Other fields (Note: rollNumber and email are strictly ignored/prevented from editing)
    if (department !== undefined) profile.department = department.trim();
    if (batch !== undefined) profile.batch = Number(batch);
    if (phone !== undefined) profile.phone = phone.trim();
    if (profilePhoto !== undefined) {
      profile.profilePhoto = profilePhoto;
      await User.findByIdAndUpdate(req.user._id, { profilePhoto });
    }

    if (skills !== undefined) {
      profile.skills = Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    await profile.save();

    // Update full name in User record if changed
    let updatedUser = req.user;
    if (name && name.trim() && name.trim() !== req.user.name) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim() },
        { new: true }
      );
    }

    const completion = calculateProfileCompletion(updatedUser, profile);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: {
        ...profile.toObject(),
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto || profile.profilePhoto || '',
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload student resume (PDF only, max 5MB)
// @route   POST /api/users/profile/resume
// @access  Private (Student)
export const uploadResumeFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a PDF resume file to upload.',
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    // Clean up previous resume file if it was stored locally
    if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
      const oldFilename = profile.resumeUrl.replace('/uploads/resumes/', '');
      const oldPath = path.join(__dirname, '../uploads/resumes', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not remove previous resume file:', e.message);
        }
      }
    }

    // Save relative URL path and metadata
    profile.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    profile.resumeOriginalName = req.file.originalname;
    profile.resumeSize = req.file.size;
    profile.resumeUpdatedAt = new Date();

    // Persist actual original PDF binary in MongoDB so it is NEVER lost across container restarts
    try {
      if (fs.existsSync(req.file.path)) {
        const fileBuf = fs.readFileSync(req.file.path);
        profile.resumeData = fileBuf.toString('base64');
        profile.markModified('resumeData');
      }
    } catch (readErr) {
      console.warn('Could not read uploaded PDF file into MongoDB buffer:', readErr.message);
    }

    await profile.save();

    const completion = calculateProfileCompletion(req.user, profile);

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully!',
      resume: {
        url: profile.resumeUrl,
        originalName: profile.resumeOriginalName,
        size: profile.resumeSize,
        updatedAt: profile.resumeUpdatedAt,
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download or preview student's own resume
// @route   GET /api/users/profile/resume/download
// @access  Private (Student)
export const downloadResumeFile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).select('+resumeData');
    if (!profile || !profile.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume document has been uploaded yet. Please upload your PDF resume in your Student Profile.',
      });
    }

    const isInline =
      req.query.inline === 'true' ||
      req.query.preview === 'true' ||
      req.query.view === 'true';

    const filename = path.basename(profile.resumeUrl);
    let filePath = path.join(__dirname, '../uploads/resumes', filename);

    // If file missing on disk (e.g. Render restarted container), restore EXACT original PDF from MongoDB
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
      const altPath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(altPath) && fs.statSync(altPath).size >= 100) {
        filePath = altPath;
      } else if (profile.resumeData) {
        try {
          const resumesDir = path.join(__dirname, '../uploads/resumes');
          if (!fs.existsSync(resumesDir)) {
            fs.mkdirSync(resumesDir, { recursive: true });
          }
          const buf = Buffer.from(profile.resumeData, 'base64');
          fs.writeFileSync(filePath, buf);
        } catch (restoreErr) {
          console.error('Error restoring original resume PDF from MongoDB:', restoreErr);
        }
      }
    }

    const downloadName =
      profile.resumeOriginalName || `${req.user.name.replace(/\s+/g, '_')}_Resume.pdf`;

    if (fs.existsSync(filePath) && fs.statSync(filePath).size >= 100) {
      if (isInline) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(downloadName)}"`
        );
        return res.sendFile(filePath);
      }
      return res.download(filePath, downloadName);
    }

    if (profile.resumeData) {
      const buf = Buffer.from(profile.resumeData, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(downloadName)}"`
      );
      return res.send(buf);
    }

    return res.status(404).json({
      success: false,
      message: 'Original resume document is missing on the server. Please re-upload your PDF resume.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download or preview any student's resume (Officer only)
// @route   GET /api/users/students/:id/resume
// @access  Private (Officer only)
export const getStudentResumeFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    let profile = await StudentProfile.findById(id).select('+resumeData').populate('user', 'name email');
    if (!profile) {
      profile = await StudentProfile.findOne({ user: id }).select('+resumeData').populate('user', 'name email');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    const resumeUrl = profile.resumeUrl;
    if (!resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume document has been uploaded for this student.',
      });
    }

    const isInline =
      req.query.inline === 'true' ||
      req.query.preview === 'true' ||
      req.query.view === 'true';

    const studentName = profile.user?.name || profile.name || 'Candidate';
    const originalName =
      profile.resumeOriginalName || `${studentName.replace(/\s+/g, '_')}_Resume.pdf`;

    if (
      resumeUrl.startsWith('/uploads/') ||
      resumeUrl.startsWith('uploads/') ||
      resumeUrl.includes('resume-')
    ) {
      const filename = path.basename(resumeUrl);
      let filePath = path.join(__dirname, '../uploads/resumes', filename);

      // Restore exact original PDF from MongoDB if missing on disk
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
        const altPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(altPath) && fs.statSync(altPath).size >= 100) {
          filePath = altPath;
        } else if (profile.resumeData) {
          try {
            const resumesDir = path.join(__dirname, '../uploads/resumes');
            if (!fs.existsSync(resumesDir)) {
              fs.mkdirSync(resumesDir, { recursive: true });
            }
            const buf = Buffer.from(profile.resumeData, 'base64');
            fs.writeFileSync(filePath, buf);
          } catch (restoreErr) {
            console.error('Error restoring original resume PDF from MongoDB:', restoreErr);
          }
        }
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).size >= 100) {
        if (isInline) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(originalName)}"`
          );
          return res.sendFile(filePath);
        }
        return res.download(filePath, originalName);
      }

      if (profile.resumeData) {
        const buf = Buffer.from(profile.resumeData, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalName)}"`
        );
        return res.send(buf);
      }
    }

    if (profile.resumeUrl.startsWith('http://') || profile.resumeUrl.startsWith('https://')) {
      return res.redirect(profile.resumeUrl);
    }

    return res.status(404).json({
      success: false,
      message: 'The original resume document uploaded for this student is not available on the server.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile photo / avatar (Students & Placement Officers)
// @route   POST /api/users/profile/avatar
// @access  Private (Student & Officer)
export const uploadAvatarFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file (JPG, PNG, WebP).',
      });
    }

    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    // Generate Base64 data URL for resilience on ephemeral serverless hosts (Render, Vercel)
    let effectivePhoto = photoUrl;
    try {
      if (fs.existsSync(req.file.path)) {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        effectivePhoto = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      }
    } catch (readErr) {
      console.warn('[Avatar Upload] Base64 generation warning, using file path:', readErr.message);
      effectivePhoto = photoUrl;
    }

    // Always update User record
    await User.findByIdAndUpdate(req.user._id, { profilePhoto: effectivePhoto });

    // Update role-specific profile
    if (req.user.role === 'student') {
      await StudentProfile.findOneAndUpdate(
        { user: req.user._id },
        { profilePhoto: effectivePhoto }
      );
    } else if (req.user.role === 'officer') {
      await OfficerProfile.findOneAndUpdate(
        { user: req.user._id },
        { profilePhoto: effectivePhoto },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully!',
      profilePhoto: effectivePhoto,
      relativeUrl: photoUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove / Clear profile photo
// @route   DELETE /api/users/profile/avatar
// @access  Private (Student & Officer)
export const deleteAvatarFile = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { profilePhoto: '' });

    if (req.user.role === 'student') {
      await StudentProfile.findOneAndUpdate({ user: req.user._id }, { profilePhoto: '' });
    } else if (req.user.role === 'officer') {
      await OfficerProfile.findOneAndUpdate({ user: req.user._id }, { profilePhoto: '' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully.',
      profilePhoto: '',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Placement Officer profile
// @route   GET /api/users/officer/profile
// @access  Private (Officer)
export const getOfficerProfile = async (req, res, next) => {
  try {
    let officerProfile = await OfficerProfile.findOne({ user: req.user._id });
    if (!officerProfile) {
      officerProfile = await OfficerProfile.create({
        user: req.user._id,
        designation: 'Training & Placement Officer',
        department: 'Training & Placement Cell',
        officeLocation: 'Training & Placement Office, Admin Block',
        profilePhoto: req.user.profilePhoto || '',
      });
    }

    const effectivePhoto = req.user.profilePhoto || officerProfile.profilePhoto || '';

    res.status(200).json({
      success: true,
      profile: {
        _id: officerProfile._id,
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        designation: officerProfile.designation || 'Placement Officer',
        department: officerProfile.department || 'Training & Placement Cell',
        phone: officerProfile.phone || '',
        officeLocation:
          officerProfile.officeLocation || 'Training & Placement Office, Admin Block',
        employeeId: officerProfile.employeeId || '',
        linkedinUrl: officerProfile.linkedinUrl || '',
        bio: officerProfile.bio || '',
        profilePhoto: effectivePhoto,
        createdAt: officerProfile.createdAt,
        updatedAt: officerProfile.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Placement Officer profile
// @route   PUT /api/users/officer/profile
// @access  Private (Officer)
export const updateOfficerProfile = async (req, res, next) => {
  try {
    const {
      name,
      designation,
      department,
      phone,
      officeLocation,
      employeeId,
      linkedinUrl,
      bio,
      profilePhoto,
    } = req.body;

    let officerProfile = await OfficerProfile.findOne({ user: req.user._id });
    if (!officerProfile) {
      officerProfile = new OfficerProfile({ user: req.user._id });
    }

    if (designation !== undefined) officerProfile.designation = designation.trim();
    if (department !== undefined) officerProfile.department = department.trim();
    if (phone !== undefined) officerProfile.phone = phone.trim();
    if (officeLocation !== undefined) officerProfile.officeLocation = officeLocation.trim();
    if (employeeId !== undefined) officerProfile.employeeId = employeeId.trim();
    if (bio !== undefined) officerProfile.bio = bio.trim();

    if (linkedinUrl !== undefined) {
      const urlPattern = /^https?:\/\/.+/i;
      if (linkedinUrl && !urlPattern.test(linkedinUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn URL must start with http:// or https://',
        });
      }
      officerProfile.linkedinUrl = linkedinUrl ? linkedinUrl.trim() : '';
    }

    if (profilePhoto !== undefined) {
      officerProfile.profilePhoto = profilePhoto;
      await User.findByIdAndUpdate(req.user._id, { profilePhoto });
    }

    await officerProfile.save();

    let updatedUser = req.user;
    if (name && name.trim() && name.trim() !== req.user.name) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim() },
        { new: true }
      );
    }

    const effectivePhoto = updatedUser.profilePhoto || officerProfile.profilePhoto || '';

    res.status(200).json({
      success: true,
      message: 'Placement Officer profile updated successfully!',
      profile: {
        _id: officerProfile._id,
        user: req.user._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        designation: officerProfile.designation,
        department: officerProfile.department,
        phone: officerProfile.phone,
        officeLocation: officerProfile.officeLocation,
        employeeId: officerProfile.employeeId,
        linkedinUrl: officerProfile.linkedinUrl,
        bio: officerProfile.bio,
        profilePhoto: effectivePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (Officer only)
// @route   GET /api/users/students
// @access  Private (Officer)
export const getAllStudents = async (req, res, next) => {
  try {
    const { department, batch, minCgpa, placementStatus, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (batch) filter.batch = Number(batch);
    if (minCgpa) filter.cgpa = { $gte: Number(minCgpa) };
    if (placementStatus) filter.placementStatus = placementStatus;

    let profiles = await StudentProfile.find(filter)
      .populate('user', 'name email isActive createdAt profilePhoto')
      .populate('placedCompany', 'name')
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      profiles = profiles.filter((p) => {
        return (
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q) ||
          p.rollNumber?.toLowerCase().includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      total: profiles.length,
      students: profiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete student profile by ID (Officer only)
// @route   GET /api/users/students/:id
// @access  Private (Officer only)
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by student profile ID or User ID
    let profile = await StudentProfile.findById(id)
      .populate('user', 'name email isActive createdAt profilePhoto')
      .populate('placedCompany', 'name industry website logoUrl');

    if (!profile) {
      profile = await StudentProfile.findOne({ user: id })
        .populate('user', 'name email isActive createdAt profilePhoto')
        .populate('placedCompany', 'name industry website logoUrl');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    // Get applicant's applications
    const applications = await Application.find({ student: profile.user?._id })
      .populate('drive', 'title jobRole packageLPA status')
      .populate('company', 'name')
      .sort({ appliedAt: -1 });

    const completion = calculateProfileCompletion(profile.user, profile);

    res.status(200).json({
      success: true,
      student: {
        ...profile.toObject(),
        name: profile.user?.name,
        email: profile.user?.email,
        profilePhoto: profile.profilePhoto || profile.user?.profilePhoto || '',
      },
      applications,
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a student account and all related data (Placement Officer only)
// @route   DELETE /api/users/students/:id
// @access  Private (Placement Officer only)
export const deleteStudentAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by student profile ID or User ID
    let profile = await StudentProfile.findById(id);
    let user = null;

    if (profile) {
      user = await User.findById(profile.user);
    } else {
      user = await User.findById(id);
      if (user) {
        profile = await StudentProfile.findOne({ user: user._id });
      }
    }

    if (!user && !profile) {
      return res.status(404).json({
        success: false,
        message: 'Student account record not found.',
      });
    }

    // Safety check: Placement Officer accounts cannot be deleted through this endpoint
    if (user && user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Action denied: Placement Officer accounts cannot be deleted here.',
      });
    }

    const targetUserId = user?._id || profile?.user;
    const targetProfileId = profile?._id;
    const studentName = user?.name || profile?.rollNumber || 'Student';
    const studentRoll = profile?.rollNumber || 'N/A';
    const studentEmail = user?.email || 'N/A';

    // 1. Delete physical resume file from disk if present
    if (profile?.resumeUrl && typeof profile.resumeUrl === 'string') {
      try {
        const cleanPath = profile.resumeUrl.replace(/^\/?(api\/)?uploads\//, '');
        const resumeDiskPath = path.join(__dirname, '..', 'uploads', cleanPath);
        if (fs.existsSync(resumeDiskPath)) {
          fs.unlinkSync(resumeDiskPath);
        }
      } catch (fileErr) {
        console.warn('[DeleteStudent] Could not remove resume file:', fileErr.message);
      }
    }

    // 2. Delete physical avatar file from disk if present
    const photoUrl = user?.profilePhoto || profile?.profilePhoto;
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.includes('uploads/avatars')) {
      try {
        const cleanPath = photoUrl.replace(/^\/?(api\/)?uploads\//, '');
        const avatarDiskPath = path.join(__dirname, '..', 'uploads', cleanPath);
        if (fs.existsSync(avatarDiskPath)) {
          fs.unlinkSync(avatarDiskPath);
        }
      } catch (fileErr) {
        console.warn('[DeleteStudent] Could not remove avatar file:', fileErr.message);
      }
    }

    // 3. Delete all applications submitted by this student
    if (targetUserId || targetProfileId) {
      const deleteAppFilter = {
        $or: [
          ...(targetUserId ? [{ student: targetUserId }] : []),
          ...(targetProfileId ? [{ studentProfile: targetProfileId }] : []),
        ],
      };
      await Application.deleteMany(deleteAppFilter);
    }

    // 4. Delete notifications sent to this student
    if (targetUserId) {
      await Notification.deleteMany({ recipient: targetUserId });
    }

    // 5. Delete StudentProfile
    if (targetProfileId) {
      await StudentProfile.findByIdAndDelete(targetProfileId);
    } else if (targetUserId) {
      await StudentProfile.findOneAndDelete({ user: targetUserId });
    }

    // 6. Delete User authentication record
    if (targetUserId) {
      await User.findByIdAndDelete(targetUserId);
    }

    return res.status(200).json({
      success: true,
      message: `Student account for ${studentName} (${studentRoll} • ${studentEmail}) and all associated records have been permanently deleted.`,
      deletedStudentId: targetUserId || targetProfileId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student stats (Officer only)
// @route   GET /api/users/stats
// @access  Private (Officer)
export const getPlacementStats = async (req, res, next) => {
  try {
    const totalStudents = await StudentProfile.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const placedStudents = await StudentProfile.countDocuments({ placementStatus: 'Placed' });
    const unplacedStudents = totalStudents - placedStudents;
    const totalDrives = await PlacementDrive.countDocuments();
    const activeDrives = await PlacementDrive.countDocuments({
      status: { $in: ['Published', 'Upcoming', 'Ongoing'] },
    });
    const totalApplications = await Application.countDocuments();
    const selectedStudents = await Application.countDocuments({ status: 'Selected' });
    const shortlistedStudents = await Application.countDocuments({ status: 'Shortlisted' });

    // Department breakdown
    const deptStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'Placed'] }, 1, 0] },
          },
          avgCgpa: { $avg: '$cgpa' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        placedStudents,
        unplacedStudents,
        placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        totalDrives,
        activeDrives,
        totalApplications,
        selectedStudents,
        shortlistedStudents,
        deptStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete Officer Dashboard Data (KPIs, Recent Drives, Recent Applications, Analytics, Activity)
// @route   GET /api/users/officer/dashboard
// @access  Private (Officer only)
export const getOfficerDashboardData = async (req, res, next) => {
  try {
    // 1. KPI Numbers
    const [
      totalStudents,
      totalCompanies,
      activeDrives,
      totalDrives,
      totalApplications,
      selectedStudents,
      shortlistedStudents,
    ] = await Promise.all([
      StudentProfile.countDocuments(),
      Company.countDocuments(),
      PlacementDrive.countDocuments({ status: { $in: ['Published', 'Upcoming', 'Ongoing'] } }),
      PlacementDrive.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Selected' }),
      Application.countDocuments({ status: 'Shortlisted' }),
    ]);

    // 2. Recent Placement Drives (top 5 sorted by createdAt desc)
    const rawDrives = await PlacementDrive.find()
      .populate('company', 'name logoUrl industry location')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentDrives = await Promise.all(
      rawDrives.map(async (drive) => {
        const applicantCount = await Application.countDocuments({ drive: drive._id });
        return {
          _id: drive._id,
          title: drive.title,
          jobRole: drive.jobRole,
          packageLPA: drive.packageLPA,
          applicationClosingDate: drive.applicationClosingDate || drive.registrationDeadline,
          status: drive.status,
          company: drive.company || null,
          applicantCount,
          createdAt: drive.createdAt,
        };
      })
    );

    // 3. Recent Applications (top 6 sorted by appliedAt/createdAt desc)
    const rawApplications = await Application.find()
      .populate('student', 'name email')
      .populate('studentProfile', 'rollNumber department cgpa')
      .populate('company', 'name logoUrl')
      .populate('drive', 'title jobRole packageLPA status')
      .sort({ appliedAt: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const recentApplications = rawApplications.map((app) => ({
      _id: app._id,
      studentName: app.student?.name || 'Student',
      studentEmail: app.student?.email || '',
      rollNumber: app.studentProfile?.rollNumber || app.resumeSnapshot?.studentRollNumber || 'N/A',
      department: app.studentProfile?.department || app.resumeSnapshot?.studentDepartment || 'N/A',
      companyName: app.company?.name || 'Company',
      companyLogo: app.company?.logoUrl || '',
      jobRole: app.drive?.jobRole || 'Role',
      packageLPA: app.drive?.packageLPA || 0,
      appliedAt: app.appliedAt || app.createdAt,
      status: app.status,
      currentRound: app.currentRound || 1,
    }));

    // 4. Analytics:
    // 4a. Applications by Company (top 6)
    const applicationsByCompany = await Application.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } },
          shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'Shortlisted'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyInfo',
        },
      },
      { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          companyId: '$_id',
          companyName: { $ifNull: ['$companyInfo.name', 'Unspecified'] },
          count: 1,
          selected: 1,
          shortlisted: 1,
        },
      },
    ]);

    // 4b. Selected Students by Department
    const selectedByDeptRaw = await Application.aggregate([
      { $match: { status: 'Selected' } },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: 'studentProfile',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$profile.department', 'Other'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const selectedByDepartment = selectedByDeptRaw.map((d) => ({
      department: d._id,
      count: d.count,
    }));

    // 4c. Application Status Distribution
    const statusDistributionRaw = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const statusDistribution = statusDistributionRaw.map((s) => ({
      status: s._id,
      count: s.count,
    }));

    // 4d. Placement Drive Statistics by Status & Package
    const driveStatusStats = await PlacementDrive.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPackage: { $avg: '$packageLPA' },
          maxPackage: { $max: '$packageLPA' },
          minPackage: { $min: '$packageLPA' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const overallPackageAgg = await PlacementDrive.aggregate([
      {
        $group: {
          _id: null,
          avgPackage: { $avg: '$packageLPA' },
          maxPackage: { $max: '$packageLPA' },
          minPackage: { $min: '$packageLPA' },
        },
      },
    ]);

    const driveStats = {
      byStatus: driveStatusStats.map((d) => ({
        status: d._id,
        count: d.count,
        avgPackage: d.avgPackage ? Number(d.avgPackage.toFixed(2)) : 0,
      })),
      totalDrives,
      activeDrives,
      avgPackage: overallPackageAgg[0]?.avgPackage ? Number(overallPackageAgg[0].avgPackage.toFixed(2)) : 0,
      maxPackage: overallPackageAgg[0]?.maxPackage || 0,
      minPackage: overallPackageAgg[0]?.minPackage || 0,
    };

    // 4e. Department Placement breakdown (Registered vs Placed)
    const deptStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'Placed'] }, 1, 0] },
          },
          avgCgpa: { $avg: '$cgpa' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // 5. Recent Officer Activity (Aggregated from real database events)
    const activities = [];

    // 5a. Recent Companies added
    const recentCompanyDocs = await Company.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .select('name createdAt')
      .lean();
    recentCompanyDocs.forEach((c) => {
      activities.push({
        id: `comp-${c._id}`,
        type: 'company_added',
        title: 'Company Added',
        description: `Added "${c.name}" to campus recruitment registry`,
        timestamp: c.createdAt,
        link: '/officer/companies',
      });
    });

    // 5b. Recent Drives Created
    const recentDriveDocs = await PlacementDrive.find()
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(4)
      .select('title status createdAt company jobRole')
      .lean();
    recentDriveDocs.forEach((d) => {
      activities.push({
        id: `drive-create-${d._id}`,
        type: 'drive_created',
        title: 'Placement Drive Created',
        description: `Scheduled "${d.title}" (${d.jobRole}) for ${d.company?.name || 'Company'}`,
        timestamp: d.createdAt,
        link: '/officer/drives',
      });
    });

    // 5c. Recent Closed/Completed Drives
    const recentClosedDocs = await PlacementDrive.find({ status: { $in: ['Closed', 'Completed'] } })
      .populate('company', 'name')
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title status updatedAt company')
      .lean();
    recentClosedDocs.forEach((d) => {
      activities.push({
        id: `drive-close-${d._id}`,
        type: 'drive_closed',
        title: 'Drive Closed',
        description: `Applications concluded for "${d.title}"`,
        timestamp: d.updatedAt,
        link: '/officer/drives',
      });
    });

    // 5d. Recent Status Updates from Application statusHistory
    const recentAppsWithHistory = await Application.find({
      'statusHistory.0': { $exists: true },
    })
      .populate('student', 'name')
      .populate('company', 'name')
      .populate('drive', 'jobRole')
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    recentAppsWithHistory.forEach((app) => {
      const latestHistory = app.statusHistory?.[app.statusHistory.length - 1];
      if (latestHistory) {
        activities.push({
          id: `app-status-${app._id}-${latestHistory._id || latestHistory.updatedDate}`,
          type: 'status_updated',
          title: 'Application Status Updated',
          description: `${app.student?.name || 'Student'} marked as "${latestHistory.newStatus}" for ${app.company?.name || 'Drive'}${latestHistory.remarks ? ` (${latestHistory.remarks})` : ''}`,
          timestamp: latestHistory.updatedDate || app.updatedAt,
          link: '/officer/applications',
        });
      }
    });

    // Sort all real activities by timestamp descending and take top 8
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activities.slice(0, 8);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        activeDrives,
        totalDrives,
        totalApplications,
        selectedStudents,
        shortlistedStudents,
        placedStudents: selectedStudents,
        placementRate: totalStudents > 0 ? Math.round((selectedStudents / totalStudents) * 100) : 0,
      },
      recentDrives,
      recentApplications,
      analytics: {
        applicationsByCompany,
        selectedByDepartment,
        statusDistribution,
        driveStats,
        deptPerformance: deptStats,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};
