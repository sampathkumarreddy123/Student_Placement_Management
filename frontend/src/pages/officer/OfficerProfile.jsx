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
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { officerService } from '../../services/officerService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
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
  const [copiedId, setCopiedId] = useState(false);

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

  const handleCopyId = () => {
    if (formData.employeeId) {
      navigator.clipboard.writeText(formData.employeeId);
      setCopiedId(true);
      toast.showSuccess('Staff ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

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
    if (e) e.preventDefault();
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

    if (file.size > 5 * 1024 * 1024) {
      toast.showError('Image file is too large. Please select a photo under 5MB.');
      e.target.value = '';
      return;
    }

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
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* 1. LINKEDIN/PORTAL STYLE PROFILE HEADER CARD */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm overflow-hidden relative">
        {/* Subtle decorative cover banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#163A5F] via-[#1E4E79] to-[#2563EB] relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-medium">
            <Building className="w-3.5 h-3.5" />
            <span>Placement Cell Administration</span>
          </div>
        </div>

        {/* Identity & Actions Container */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 -mt-14 sm:-mt-16 mb-4">
            {/* Circular Avatar with Camera overlay */}
            <div className="relative group flex-shrink-0">
              <div
                onClick={() => setShowPhotoModal(true)}
                className="w-28 h-28 rounded-full bg-[#EFF6FF] border-4 border-white shadow-md flex items-center justify-center text-[#163A5F] font-bold text-3xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2563EB] transition-all"
                title="Click to view full photo"
              >
                {effectivePhoto ? (
                  <img
                    src={getImageUrl(effectivePhoto)}
                    alt={formData.name || user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(formData.name || user?.name || 'O').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Upload & Crop Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || removingPhoto}
                className="absolute bottom-1 right-1 w-8 h-8 bg-[#163A5F] hover:bg-[#2563EB] text-white rounded-full shadow-md border-2 border-white transition-all flex items-center justify-center cursor-pointer"
                title="Upload & Crop Photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Remove Photo Button */}
              {effectivePhoto && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  disabled={uploadingPhoto || removingPhoto}
                  className="absolute top-1 right-1 w-6 h-6 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-sm border border-rose-200 transition-colors flex items-center justify-center cursor-pointer"
                  title="Remove Photo"
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

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={KeyRound}
                onClick={() => setChangePasswordOpen(true)}
              >
                Change Password
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={saving}
                onClick={handleSubmit}
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Name & Academic Meta */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold text-[#172554] tracking-tight">
                {formData.name || user?.name}
              </h1>

              <Badge variant="primary" size="sm">
                {formData.designation || 'Placement Officer'}
              </Badge>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/25">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authorized Placement Officer
              </span>
            </div>

            {/* Sub-identity row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#64748B]">
              {formData.employeeId ? (
                <div className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#163A5F] px-2.5 py-1 rounded-md border border-[#DBEAFE] font-mono font-bold">
                  <span>ID: {formData.employeeId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-[#2563EB] hover:text-[#163A5F] transition-colors p-0.5 ml-0.5"
                    title="Copy Staff ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#0D9488]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : null}

              <span className="font-medium text-[#172554]">• {formData.department}</span>

              {formData.officeLocation && (
                <span className="font-medium text-[#64748B]">• {formData.officeLocation}</span>
              )}

              <span className="font-medium text-[#64748B] hidden md:inline">
                • {formData.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STRUCTURED PROFILE SECTIONS */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Administrative & Contact Details: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* CARD 1: Personal & Administrative Information */}
            <Card
              title="1. Personal & Administrative Information"
              subtitle="Official officer designation and institutional placement cell credentials"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1.5">
                    Full Legal Name <span className="text-rose-500">*</span>
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

                {/* Staff ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#172554]">
                      Staff / Employee ID
                    </label>
                    <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                      <Lock className="w-2.5 h-2.5 text-[#2563EB]" /> Institutional
                    </span>
                  </div>
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

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1.5">
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
                  <label className="block text-xs font-semibold text-[#172554] mb-1.5">
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
              </div>
            </Card>

            {/* CARD 2: Institutional Contact & Office Location */}
            <Card
              title="2. Contact Information & Office Location"
              subtitle="Direct channels for student inquiries, university coordination, and corporate recruiters"
            >
              <div className="space-y-4">
                {/* Official Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#172554]">
                      Official College Email <span className="text-gray-400 font-normal">(Primary Identifier)</span>
                    </label>
                    <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                      <Lock className="w-2.5 h-2.5 text-[#2563EB]" /> Locked
                    </span>
                  </div>
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

                {/* Phone & Cabin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172554] mb-1.5">
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

                  <div>
                    <label className="block text-xs font-semibold text-[#172554] mb-1.5">
                      Office Cabin / Room Location
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="officeLocation"
                        value={formData.officeLocation}
                        onChange={handleChange}
                        placeholder="e.g. Admin Block, Ground Floor"
                        className="w-full text-xs rounded-xl border border-[#DBEAFE] pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (Bio, Social & Security: 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARD 3: Professional Background & Bio */}
            <Card
              title="3. Professional Bio & Message"
              subtitle="Welcome note and guidelines presented to students and corporate recruiters"
            >
              <div className="space-y-4">
                {/* LinkedIn Profile */}
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]" />
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://www.linkedin.com/in/username"
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

                {/* Bio Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-[#172554] mb-1.5">
                    Placement Objectives / Department Vision
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Brief summary of placement guidelines, department vision, or welcome note to recruiters and students..."
                    className="w-full text-xs rounded-xl border border-[#DBEAFE] p-3 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </Card>

            {/* CARD 4: Account Security & Access Settings */}
            <Card
              title="4. Security & Access Settings"
              subtitle="Administrative credential management and authorization status"
            >
              <div className="space-y-3">
                {/* Password Setting Tile */}
                <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-xs flex-shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172554]">Account Password</h4>
                      <p className="text-[11px] text-[#64748B]">Protected with verification questions</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={KeyRound}
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Change
                  </Button>
                </div>

                {/* Security Questions Recovery Status */}
                <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#0D9488] shadow-xs flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172554]">Security Questions</h4>
                      <p className="text-[11px] text-[#64748B]">Configured for account recovery</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded border border-[#0D9488]/20">
                    Active
                  </span>
                </div>

                {/* Session / Role Access */}
                <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-xs flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172554]">System Role</h4>
                      <p className="text-[11px] text-[#64748B]">Full Placement Cell Administration</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D9488]">
                    Authorized
                  </span>
                </div>
              </div>
            </Card>

            {/* Save Profile Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={saving}
                icon={Save}
                className="w-full justify-center"
              >
                Save Officer Profile Details
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Profile Picture Full View Modal */}
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

      {/* Profile Picture Cropper Modal */}
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
