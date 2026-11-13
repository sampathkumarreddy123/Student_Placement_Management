import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import StudentProfile from '../models/StudentProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all companies with filters, search, and dynamic drive counts
// @route   GET /api/companies
// @access  Private (Officer & Student)
export const getCompanies = async (req, res, next) => {
  try {
    const { search, industry, location, status, page = 1, limit = 10, all } = req.query;
    const filter = {};

    // Status filter (Active vs Archived)
    if (status === 'archived') {
      filter.isArchived = true;
    } else if (status === 'all') {
      // Don't filter out archived
    } else {
      // Default: show only active / non-archived companies
      filter.isArchived = { $ne: true };
    }

    if (industry && industry !== 'All') {
      filter.industry = industry;
    }

    if (location && location !== 'All') {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { industry: { $regex: q, $options: 'i' } },
        { contactPerson: { $regex: q, $options: 'i' } },
      ];
    }

    // Determine pagination
    const isAll = all === 'true' || all === true;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = isAll ? 1000 : parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute dynamic number of placement drives for each company
    const enrichedCompanies = await Promise.all(
      companies.map(async (comp) => {
        const drivesCount = await PlacementDrive.countDocuments({ company: comp._id });
        const placedCount = await StudentProfile.countDocuments({ placedCompany: comp._id });
        return {
          ...comp.toObject(),
          drivesCount,
          placedCount,
        };
      })
    );

    // Get unique industries and locations for filtering dropdowns
    const [allIndustries, allLocations] = await Promise.all([
      Company.distinct('industry'),
      Company.distinct('location'),
    ]);

    res.status(200).json({
      success: true,
      count: enrichedCompanies.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      companies: enrichedCompanies,
      filterOptions: {
        industries: allIndustries.filter(Boolean).sort(),
        locations: allLocations.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Get drives & placed students for this company
    const drives = await PlacementDrive.find({ company: company._id }).sort({ driveDate: -1 });
    const placedStudents = await StudentProfile.find({ placedCompany: company._id })
      .populate('user', 'name email')
      .select('rollNumber department batch cgpa');

    res.status(200).json({
      success: true,
      company: {
        ...company.toObject(),
        drivesCount: drives.length,
        placedCount: placedStudents.length,
      },
      drives,
      placedStudents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new company
// @route   POST /api/companies
// @access  Private (Officer only)
export const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      website,
      industry,
      description,
      location,
      contactEmail,
      contactPerson,
      logoUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required.',
      });
    }

    // Check for duplicate name
    const existing = await Company.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A company with name "${name.trim()}" already exists.`,
      });
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (website && !urlPattern.test(website.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Website URL must begin with http:// or https://',
      });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (contactEmail && !emailRegex.test(contactEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid contact email format.',
      });
    }

    const company = await Company.create({
      name: name.trim(),
      website: website ? website.trim() : '',
      industry: industry ? industry.trim() : 'Information Technology',
      description: description ? description.trim() : '',
      location: location ? location.trim() : '',
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : '',
      contactPerson: contactPerson ? contactPerson.trim() : '',
      logoUrl: logoUrl ? logoUrl.trim() : '',
      isActive: true,
      isArchived: false,
    });

    res.status(201).json({
      success: true,
      message: `Partner company "${company.name}" added successfully!`,
      company: {
        ...company.toObject(),
        drivesCount: 0,
        placedCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company details
// @route   PUT /api/companies/:id
// @access  Private (Officer only)
export const updateCompany = async (req, res, next) => {
  try {
    const {
      name,
      website,
      industry,
      description,
      location,
      contactEmail,
      contactPerson,
      logoUrl,
      isActive,
      isArchived,
    } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // If changing name, check for uniqueness
    if (name && name.trim().toLowerCase() !== company.name.toLowerCase()) {
      const duplicate = await Company.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: company._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A company with name "${name.trim()}" already exists.`,
        });
      }
      company.name = name.trim();
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (website !== undefined) {
      if (website && !urlPattern.test(website.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Website URL must begin with http:// or https://',
        });
      }
      company.website = website ? website.trim() : '';
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (contactEmail !== undefined) {
      if (contactEmail && !emailRegex.test(contactEmail.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid contact email format.',
        });
      }
      company.contactEmail = contactEmail ? contactEmail.trim().toLowerCase() : '';
    }

    if (industry !== undefined) company.industry = industry.trim();
    if (description !== undefined) company.description = description.trim();
    if (location !== undefined) company.location = location.trim();
    if (contactPerson !== undefined) company.contactPerson = contactPerson.trim();
    if (logoUrl !== undefined) company.logoUrl = logoUrl.trim();
    if (isActive !== undefined) company.isActive = Boolean(isActive);
    if (isArchived !== undefined) company.isArchived = Boolean(isArchived);

    await company.save();

    const drivesCount = await PlacementDrive.countDocuments({ company: company._id });
    const placedCount = await StudentProfile.countDocuments({ placedCompany: company._id });

    res.status(200).json({
      success: true,
      message: 'Company details updated successfully!',
      company: {
        ...company.toObject(),
        drivesCount,
        placedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload company logo image
// @route   POST /api/companies/:id/logo
// @access  Private (Officer only)
export const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image file (JPG, PNG, WebP, SVG).',
      });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Clean up old logo if stored locally
    if (company.logoUrl && company.logoUrl.startsWith('/uploads/logos/')) {
      const oldFilename = company.logoUrl.replace('/uploads/logos/', '');
      const oldPath = path.join(__dirname, '../uploads/logos', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not remove previous logo file:', e.message);
        }
      }
    }

    company.logoUrl = `/uploads/logos/${req.file.filename}`;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully!',
      logoUrl: company.logoUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Safe Delete or Archive Company
// @route   DELETE /api/companies/:id
// @access  Private (Officer only)
export const deleteCompany = async (req, res, next) => {
  try {
    const { archive } = req.query; // If archive=true, safely archive instead of hard delete
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Check for associated records
    const drivesCount = await PlacementDrive.countDocuments({ company: company._id });
    const placedCount = await StudentProfile.countDocuments({ placedCompany: company._id });

    // If company has active drives or placed students
    if (drivesCount > 0 || placedCount > 0) {
      if (archive === 'true') {
        company.isArchived = true;
        company.isActive = false;
        await company.save();

        return res.status(200).json({
          success: true,
          archived: true,
          message: `"${company.name}" has ${drivesCount} drive(s) and ${placedCount} placed student(s). It has been safely archived to preserve placement records.`,
        });
      }

      return res.status(400).json({
        success: false,
        hasRecords: true,
        drivesCount,
        placedCount,
        message: `Cannot permanently delete "${company.name}". It is associated with ${drivesCount} placement drive(s) and ${placedCount} placed student record(s). Would you like to safely archive it instead?`,
      });
    }

    // No associated records: Safe to permanently delete
    if (company.logoUrl && company.logoUrl.startsWith('/uploads/logos/')) {
      const filename = company.logoUrl.replace('/uploads/logos/', '');
      const filePath = path.join(__dirname, '../uploads/logos', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not remove company logo file:', e.message);
        }
      }
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      archived: false,
      message: `Company "${company.name}" permanently deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Company Archive Status
// @route   PATCH /api/companies/:id/archive
// @access  Private (Officer only)
export const toggleArchiveCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    company.isArchived = !company.isArchived;
    company.isActive = !company.isArchived;
    await company.save();

    res.status(200).json({
      success: true,
      message: `"${company.name}" is now ${company.isArchived ? 'archived' : 'active'}.`,
      company,
    });
  } catch (error) {
    next(error);
  }
};
