import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
export const getCompanies = async (req, res, next) => {
  try {
    const { search, industry } = req.query;
    const filter = {};

    if (industry) {
      filter.industry = industry;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    const companies = await Company.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
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
        message: 'Company not found',
      });
    }

    // Get active drives for this company
    const drives = await PlacementDrive.find({ company: company._id }).sort({ driveDate: -1 });

    res.status(200).json({
      success: true,
      company,
      drives,
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
    const { name, website, industry, description, location, contactEmail, contactPerson } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required',
      });
    }

    const existing = await Company.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name already exists',
      });
    }

    const company = await Company.create({
      name: name.trim(),
      website,
      industry: industry || 'Technology',
      description,
      location,
      contactEmail,
      contactPerson,
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company,
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
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Officer only)
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Check if company has associated drives
    const associatedDrives = await PlacementDrive.countDocuments({ company: company._id });
    if (associatedDrives > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company. It has ${associatedDrives} associated placement drive(s).`,
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

