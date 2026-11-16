import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Briefcase,
  IdCard,
  Linkedin,
  Camera,
  Trash2,
  Save,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { officerService } from '../../services/officerService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import ProfilePictureModal from '../../components/common/ProfilePictureModal';
import ImageCropperModal from '../../components/common/ImageCropperModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

const OfficerProfile = () => {
  const { user, updateUserData } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: 'Placement Officer',
    department: 'Training & Placement Cell',
    phone: '',
    officeLocation: 'Training & Placement Office, Admin Block',
    employeeId: '',
    linkedinUrl: '',
    bio: '',
    profilePhoto: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Officer Profile on mount
  useEffect(() => {
    const fetchOfficerProfile = async () => {
      try {
        setLoading(true);
        const res = await officerService.getProfile();
        if (res.success && res.profile) {
          const p = res.profile;
          setFormData({
            name: p.name || user?.name || '',
            email: p.email || user?.email || '',
            designation: p.designation || 'Placement Officer',
            department: p.department || 'Training & Placement Cell',
            phone: p.phone || '',
            officeLocation: p.officeLocation || 'Training & Placement Office, Admin Block',
            employeeId: p.employeeId || '',
            linkedinUrl: p.linkedinUrl || '',
            bio: p.bio || '',
            profilePhoto: p.profilePhoto || user?.profilePhoto || '',
          });

          // Sync Auth Context with fresh profile photo if needed
          if (p.profilePhoto && p.profilePhoto !== user?.profilePhoto) {
            updateUserData({ profilePhoto: p.profilePhoto });
          }
        }
      } catch (err) {
        console.error('Failed to load officer profile:', err);
        toast.showError(err.message || 'Failed to retrieve placement officer profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchOfficerProfile();
  }, [user?.email, user?.name, user?.profilePhoto, updateUserData, toast]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (formData.linkedinUrl && !/^https?:\/\/.+/i.test(formData.linkedinUrl.trim())) {
      errors.linkedinUrl = 'LinkedIn profile URL must start with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Officer Profile Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.showError('Please correct the validation errors before saving.');
      return;
    }

    try {
      setSaving(true);
      const res = await officerService.updateProfile(formData);
      if (res.success) {
        toast.showSuccess('Placement Officer profile updated successfully!');
        // Update user context name & photo
        updateUserData({
          name: formData.name,
          profilePhoto: formData.profilePhoto,
        });
      }
    } catch (err) {
      console.error('Failed to update officer profile:', err);
      toast.showError(err.message || 'Could not update profile details.');
    } finally {
      setSaving(false);
    }
  };

  // Select Photo for Interactive Cropping
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.showError('Image file is too large. Please select a photo under 5MB.');
      e.target.value = '';
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.showError('Invalid file format. Please upload a JPG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Complete Crop & Upload
  const handleCropComplete = async (croppedFile) => {
    try {
      setUploadingPhoto(true);
      const data = new FormData();
      data.append('avatar', croppedFile);

      const res = await officerService.uploadAvatar(data);
      if (res.success && res.profilePhoto) {
        setFormData((prev) => ({ ...prev, profilePhoto: res.profilePhoto }));
        updateUserData({ profilePhoto: res.profilePhoto });
        toast.showSuccess('Profile photo cropped and updated successfully!');
        setIsCropModalOpen(false);
        setCropImageSrc('');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.showError(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove Profile Photo
  const handlePhotoRemove = async () => {
    if (!formData.profilePhoto) return;
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      setRemovingPhoto(true);
      await officerService.deleteAvatar();
      setFormData((prev) => ({ ...prev, profilePhoto: '' }));
      updateUserData({ profilePhoto: '' });
      toast.showSuccess('Profile photo removed successfully.');
    } catch (err) {
      console.error('Failed to delete avatar:', err);
      toast.showError(err.message || 'Could not remove profile photo.');
    } finally {
      setRemovingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner text="Retrieving placement officer profile credentials..." />
      </div>
    );
  }

  const effectivePhoto = formData.profilePhoto || user?.profilePhoto || '';

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Placement Officer Profile"
        subtitle="Manage your administrative credentials, institutional contact details, designation and official profile picture."
      />

      {/* 2. Top Identity Card */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Camera Overlay */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={() => setShowPhotoModal(true)}
              className="w-24 h-24 rounded-full bg-[#EFF6FF] border-2 border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-3xl shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#172554] transition-all"
              title="Click to view full profile picture"
            >
              {effectivePhoto ? (
                <img
                  src={getImageUrl(effectivePhoto)}
                  alt={formData.name || 'Officer'}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{(formData.name || user?.name || 'O').charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto || removingPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#172554] hover:bg-[#2563EB] text-white rounded-full shadow-md border-2 border-white transition-all flex items-center justify-center cursor-pointer"
              title="Upload & Crop Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Remove Button */}
            {effectivePhoto && (
              <button
                type="button"
                onClick={handlePhotoRemove}
                disabled={uploadingPhoto || removingPhoto}
                className="absolute top-0 right-0 w-6 h-6 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-sm border border-rose-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Remove Profile Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Details & Role Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-[#172554] tracking-tight">
                {formData.name || user?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Authorized Officer
              </span>
            </div>

            <p className="text-sm font-semibold text-[#2563EB]">{formData.designation}</p>
            <p className="text-xs text-gray-500">{formData.department}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-600 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {formData.email}
              </span>
              {formData.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {formData.phone}
                </span>
              )}
              {formData.officeLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {formData.officeLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-[#DBEAFE] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EFF6FF] pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#163A5F]">
                Institutional & Contact Details
              </h3>
              <p className="text-xs text-gray-500">
                Update your administrative title, official cabin location and contact credentials
              </p>
            </div>
            <span className="text-xs text-gray-400">All fields are editable</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. K. Sampath Kumar"
                  className={`w-full text-xs rounded-xl border pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 ${
                    formErrors.name
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-[#DBEAFE] focus:ring-[#2563EB]'
                  }`}
                  required
                />
              </div>
              {formErrors.name && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Official College Email (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Official College Email <span className="text-gray-400 font-normal">(Primary Identifier)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50/80 pl-9 pr-3 py-2.5 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Official Designation */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Designation / Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Head - Training & Placement"
                  className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Department / Placement Cell
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Training & Placement Cell"
                  className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Staff / Employee ID
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. MITS-TPO-01"
                  className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Contact Phone / Extension
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Office Location / Cabin */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Office Location / Cabin Room
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleChange}
                  placeholder="e.g. Training & Placement Office, Ground Floor, Admin Block"
                  className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* LinkedIn Profile URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://www.linkedin.com/in/placement-officer"
                  className={`w-full text-xs rounded-xl border pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 ${
                    formErrors.linkedinUrl
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-[#DBEAFE] focus:ring-[#2563EB]'
                  }`}
                />
              </div>
              {formErrors.linkedinUrl && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.linkedinUrl}</p>
              )}
            </div>

            {/* Bio / Message */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                About / Message to Students & Corporate Recruiters
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief summary of placement guidelines, department vision, or welcome note..."
                className="w-full text-xs rounded-xl border border-[#DBEAFE] p-3 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 pt-4 border-t border-[#EFF6FF] flex items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              leftIcon={<Save className="w-4 h-4 text-white" />}
              className="bg-[#172554] hover:bg-[#0f172a] text-white px-6 shadow-sm cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Details'}
            </Button>
          </div>
        </Card>
      </form>

      {/* 4. Account Security & Password Card */}
      <Card
        title="Account Security & Access"
        subtitle="Manage administrative credentials and security recovery questions"
      >
        <div className="p-4 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-xs flex-shrink-0">
              <KeyRound className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#172554]">
                Administrative Account Password
              </h4>
              <p className="text-[11px] sm:text-xs text-[#64748B]">
                Protected with verification questions (Minimum 8 characters)
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={KeyRound}
            onClick={() => setChangePasswordOpen(true)}
            className="bg-[#172554] hover:bg-[#0f172a] text-white shadow-xs shrink-0 cursor-pointer"
          >
            Change Password
          </Button>
        </div>
      </Card>

      {/* 5. Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* 6. Profile Picture Full View Modal */}
      <ProfilePictureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={{
          name: formData.name || user?.name,
          email: formData.email || user?.email,
          profilePhoto: effectivePhoto,
          role: 'officer',
        }}
      />

      {/* 6. Profile Picture Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSrc('');
        }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        isUploading={uploadingPhoto}
      />
    </div>
  );
};

export default OfficerProfile;
