import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Hash,
  BookOpen,
  GraduationCap,
  Phone,
  Code,
  Save,
  CheckCircle2,
  Lock,
  Upload,
  FileText,
  Download,
  ExternalLink,
  Edit3,
  X,
  Plus,
  AlertTriangle,
  Github,
  Linkedin,
  Camera,
  Trash2,
  Award,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import ProfilePictureModal from '../../components/common/ProfilePictureModal';
import ImageCropperModal from '../../components/common/ImageCropperModal';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';
import {
  downloadBlobFile,
  previewBlobFile,
  isJsonErrorBlob,
} from '../../utils/clientPdfGenerator';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028];

const COMMON_SKILLS = [
  'React',
  'Node.js',
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'SQL',
  'MongoDB',
  'Data Structures',
  'Machine Learning',
  'Git',
  'AWS',
  'Docker',
  'TypeScript',
  'Tailwind CSS',
];

const StudentProfile = () => {
  const toast = useToast();
  const { user, updateUserProfile, updateUserData } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [copiedRoll, setCopiedRoll] = useState(false);

  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  // Profile data
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, items: [] });

  // Editable Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    batch: '',
    cgpa: '',
    activeBacklogs: 0,
    totalBacklogs: 0,
    tenthPercentage: '',
    twelfthPercentage: '',
    githubUrl: '',
    linkedinUrl: '',
    skills: [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Resume Auto-Fill State
  const [parsingResume, setParsingResume] = useState(false);
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [selectedFields, setSelectedFields] = useState({
    skills: true,
    phone: true,
    tenthPercentage: true,
    twelfthPercentage: true,
    cgpa: true,
    department: true,
    githubUrl: true,
    linkedinUrl: true,
  });
  const [selectedSkills, setSelectedSkills] = useState([]);

  const handleOpenEditModal = () => {
    setFormData({
      name: profile?.name || user?.name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      batch: profile?.batch || '',
      cgpa: profile?.cgpa !== undefined && profile?.cgpa !== null && profile?.cgpa > 0 ? profile.cgpa : '',
      activeBacklogs: profile?.activeBacklogs !== undefined ? profile.activeBacklogs : profile?.backlogs || 0,
      totalBacklogs: profile?.totalBacklogs !== undefined ? profile.totalBacklogs : 0,
      tenthPercentage: profile?.tenthPercentage && profile?.tenthPercentage > 0 ? profile.tenthPercentage : '',
      twelfthPercentage: profile?.twelfthPercentage && profile?.twelfthPercentage > 0 ? profile.twelfthPercentage : '',
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      skills: Array.isArray(profile?.skills) ? [...profile.skills] : [],
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await studentService.getMyProfile();
      const p = res.profile;
      setProfile(p);
      setCompletion(res.completion || { percentage: 0, items: [] });

      setFormData({
        name: p.name || user?.name || '',
        phone: p.phone || '',
        department: p.department || '',
        batch: p.batch || '',
        cgpa: p.cgpa !== undefined && p.cgpa !== null && p.cgpa > 0 ? p.cgpa : '',
        activeBacklogs: p.activeBacklogs !== undefined ? p.activeBacklogs : p.backlogs || 0,
        totalBacklogs: p.totalBacklogs !== undefined ? p.totalBacklogs : 0,
        tenthPercentage: p.tenthPercentage && p.tenthPercentage > 0 ? p.tenthPercentage : '',
        twelfthPercentage: p.twelfthPercentage && p.twelfthPercentage > 0 ? p.twelfthPercentage : '',
        githubUrl: p.githubUrl || '',
        linkedinUrl: p.linkedinUrl || '',
        skills: Array.isArray(p.skills) ? p.skills : [],
      });
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to load student profile records.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleCopyRoll = () => {
    if (profile?.rollNumber) {
      navigator.clipboard.writeText(profile.rollNumber);
      setCopiedRoll(true);
      toast.success('Roll number copied to clipboard');
      setTimeout(() => setCopiedRoll(false), 2000);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full legal name is required';
    }

    const numCgpa = Number(formData.cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      errs.cgpa = 'CGPA must be between 0.00 and 10.00';
    }

    const num10th = Number(formData.tenthPercentage);
    if (isNaN(num10th) || num10th < 0 || num10th > 100) {
      errs.tenthPercentage = '10th percentage must be between 0 and 100';
    }

    const num12th = Number(formData.twelfthPercentage);
    if (isNaN(num12th) || num12th < 0 || num12th > 100) {
      errs.twelfthPercentage = '12th/Diploma percentage must be between 0 and 100';
    }

    const numActiveBacklogs = Number(formData.activeBacklogs);
    if (isNaN(numActiveBacklogs) || numActiveBacklogs < 0) {
      errs.activeBacklogs = 'Active backlogs cannot be negative';
    }

    const numTotalBacklogs = Number(formData.totalBacklogs);
    if (isNaN(numTotalBacklogs) || numTotalBacklogs < 0) {
      errs.totalBacklogs = 'Total backlogs cannot be negative';
    }

    if (numActiveBacklogs > numTotalBacklogs) {
      errs.activeBacklogs = 'Active backlogs cannot exceed total backlogs';
    }

    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        errs.phone = 'Please enter a valid phone number';
      }
    }

    const urlRegex = /^https?:\/\/.+/i;
    if (formData.githubUrl && !urlRegex.test(formData.githubUrl.trim())) {
      errs.githubUrl = 'URL must start with http:// or https://';
    }

    if (formData.linkedinUrl && !urlRegex.test(formData.linkedinUrl.trim())) {
      errs.linkedinUrl = 'URL must start with http:// or https://';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const skill = (skillToAdd || newSkill).trim();
    if (skill && !formData.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({
        type: 'error',
        text: 'Please review and resolve the highlighted errors below.',
      });
      return;
    }

    try {
      setSaving(true);
      const res = await studentService.updateMyProfile(formData);
      setProfile(res.profile);
      setCompletion(res.completion);
      updateUserProfile(res.profile);
      setIsEditModalOpen(false);
      toast.success('Academic and personal profile updated successfully!');
      setNotification({
        type: 'success',
        text: 'Academic and personal profile updated successfully!',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files (.pdf) are accepted for resumes.');
      setNotification({
        type: 'error',
        text: 'Invalid file format. Only PDF files (.pdf) are accepted for resumes.',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume file size must be less than 5 MB.');
      setNotification({
        type: 'error',
        text: 'File is too large. Resume file size must be less than 5 MB.',
      });
      e.target.value = '';
      return;
    }

    try {
      setUploadingResume(true);
      setNotification(null);
      const uploadData = new FormData();
      uploadData.append('resume', file);

      const res = await studentService.uploadResume(uploadData);
      setProfile((prev) => ({
        ...prev,
        resumeUrl: res.resume.url,
        resumeOriginalName: res.resume.originalName,
        resumeSize: res.resume.size,
        resumeUpdatedAt: res.resume.updatedAt,
      }));
      if (res.completion) {
        setCompletion(res.completion);
      }
      toast.success('Resume PDF uploaded and verified successfully!');
      setNotification({
        type: 'success',
        text: 'Resume PDF uploaded and verified successfully!',
      });

      // Auto-prompt to review & apply parsed credentials
      if (res.parsedProfile) {
        const p = res.parsedProfile;
        const hasAnyData = Boolean(
          (p.skills && p.skills.length > 0) ||
          p.phone ||
          p.cgpa ||
          p.tenthPercentage ||
          p.twelfthPercentage ||
          p.department ||
          p.githubUrl ||
          p.linkedinUrl
        );

        if (hasAnyData) {
          setParsedData(p);
          setSelectedSkills(p.skills || []);
          setSelectedFields({
            skills: (p.skills || []).length > 0,
            phone: Boolean(p.phone),
            tenthPercentage: Boolean(p.tenthPercentage),
            twelfthPercentage: Boolean(p.twelfthPercentage),
            cgpa: Boolean(p.cgpa),
            department: Boolean(p.department),
            githubUrl: Boolean(p.githubUrl),
            linkedinUrl: Boolean(p.linkedinUrl),
          });
          setIsAutoFillModalOpen(true);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume document.');
      setNotification({
        type: 'error',
        text: err.message || 'Failed to upload resume document.',
      });
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleParseExistingResume = async () => {
    try {
      setParsingResume(true);
      const res = await studentService.parseResume();
      if (res.parsedProfile) {
        const p = res.parsedProfile;
        setParsedData(p);
        setSelectedSkills(p.skills || []);
        setSelectedFields({
          skills: (p.skills || []).length > 0,
          phone: Boolean(p.phone),
          tenthPercentage: Boolean(p.tenthPercentage),
          twelfthPercentage: Boolean(p.twelfthPercentage),
          cgpa: Boolean(p.cgpa),
          department: Boolean(p.department),
          githubUrl: Boolean(p.githubUrl),
          linkedinUrl: Boolean(p.linkedinUrl),
        });
        setIsAutoFillModalOpen(true);
        toast.success('Resume parsed successfully! Review the extracted details.');
      } else {
        toast.info('No extractable details found in your resume.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to parse resume.');
    } finally {
      setParsingResume(false);
    }
  };

  const handleApplyParsedData = async () => {
    if (!parsedData) return;
    try {
      setSaving(true);
      const currentSkills = profile?.skills || formData.skills || [];
      const mergedSkills = selectedFields.skills
        ? Array.from(new Set([...currentSkills, ...selectedSkills]))
        : currentSkills;

      const payload = {
        name: formData.name || profile?.name || user?.name || '',
        phone: selectedFields.phone && parsedData.phone ? parsedData.phone : (profile?.phone || formData.phone || ''),
        department: selectedFields.department && parsedData.department ? parsedData.department : (profile?.department || formData.department || ''),
        batch: profile?.batch || formData.batch || '',
        cgpa: selectedFields.cgpa && parsedData.cgpa ? parsedData.cgpa : (profile?.cgpa || formData.cgpa || 0),
        activeBacklogs: profile?.activeBacklogs ?? formData.activeBacklogs ?? 0,
        totalBacklogs: profile?.totalBacklogs ?? formData.totalBacklogs ?? 0,
        tenthPercentage: selectedFields.tenthPercentage && parsedData.tenthPercentage ? parsedData.tenthPercentage : (profile?.tenthPercentage || formData.tenthPercentage || 0),
        twelfthPercentage: selectedFields.twelfthPercentage && parsedData.twelfthPercentage ? parsedData.twelfthPercentage : (profile?.twelfthPercentage || formData.twelfthPercentage || 0),
        githubUrl: selectedFields.githubUrl && parsedData.githubUrl ? parsedData.githubUrl : (profile?.githubUrl || formData.githubUrl || ''),
        linkedinUrl: selectedFields.linkedinUrl && parsedData.linkedinUrl ? parsedData.linkedinUrl : (profile?.linkedinUrl || formData.linkedinUrl || ''),
        skills: mergedSkills,
      };

      const res = await studentService.updateMyProfile(payload);
      setProfile(res.profile);
      setFormData((prev) => ({
        ...prev,
        ...payload,
      }));
      if (res.completion) {
        setCompletion(res.completion);
      }
      updateUserProfile(res.profile);
      setIsAutoFillModalOpen(false);
      toast.success('Profile auto-filled from resume successfully!');
      setNotification({
        type: 'success',
        text: 'Profile auto-filled from resume successfully!',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to apply extracted details.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkillSelection = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please choose an image file (JPG, PNG, WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5 MB.');
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

  const handleCropComplete = async (croppedFile) => {
    try {
      setUploadingPhoto(true);
      setNotification(null);
      const data = new FormData();
      data.append('avatar', croppedFile);

      const res = await studentService.uploadAvatar(data);
      const updatedPhoto = res.profilePhoto || '';
      setProfile((prev) => ({ ...prev, profilePhoto: updatedPhoto }));
      if (updateUserData) updateUserData({ profilePhoto: updatedPhoto });
      if (updateUserProfile) updateUserProfile({ ...profile, profilePhoto: updatedPhoto });
      toast.success('Profile photo updated successfully!');
      setIsCropModalOpen(false);
      setCropImageSrc('');
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.profilePhoto) return;
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      setUploadingPhoto(true);
      await studentService.deleteAvatar();
      setProfile((prev) => ({ ...prev, profilePhoto: '' }));
      if (updateUserData) updateUserData({ profilePhoto: '' });
      if (updateUserProfile) updateUserProfile({ ...profile, profilePhoto: '' });
      toast.success('Profile photo removed.');
    } catch (err) {
      toast.error('Could not remove photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!profile?.resumeUrl) {
      toast.error('No resume document uploaded yet. Please choose and upload your PDF resume.');
      return;
    }
    const filename = profile?.resumeOriginalName || 'Student_Resume.pdf';
    try {
      const response = await studentService.downloadResume();
      const isError = await isJsonErrorBlob(response.data);
      if (!isError && response.data && response.data.size > 100) {
        downloadBlobFile(new Blob([response.data], { type: 'application/pdf' }), filename);
        toast.success('Resume downloaded successfully.');
        return;
      }
    } catch (err) {
      console.warn('Backend download failed:', err);
    }
    toast.error('Resume document is currently not available on server. Please re-upload your PDF resume.');
  };

  const handlePreviewResume = async () => {
    if (!profile?.resumeUrl) {
      toast.error('No resume document uploaded yet. Please choose and upload your PDF resume.');
      return;
    }
    try {
      const response = await studentService.downloadResume();
      const isError = await isJsonErrorBlob(response.data);
      if (!isError && response.data && response.data.size > 100) {
        previewBlobFile(new Blob([response.data], { type: 'application/pdf' }));
        return;
      }
    } catch (err) {
      console.warn('Backend preview failed:', err);
    }
    toast.error('Resume document is currently not available on server. Please re-upload your PDF resume.');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving verified academic profile..." />;
  }

  const isPlaced = profile?.placementStatus === 'Placed';
  const effectivePhoto = profile?.profilePhoto || user?.profilePhoto;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        category="Student Portal"
        title="Student Profile"
        subtitle="Manage verified academic records, placement eligibility credentials, resume document, and technical portfolio."
      />

      {/* Top Notification */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.text}
          onClose={() => setNotification(null)}
        />
      )}

      {/* 2. LINKEDIN/PORTAL STYLE PROFILE HEADER CARD */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm overflow-hidden relative">
        {/* Subtle decorative cover banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[#163A5F] via-[#1E4E79] to-[#2563EB] relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-medium">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Placement Session 2026</span>
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
                    alt={profile?.name || user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(profile?.name || user?.name || 'S').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Upload & Crop Photo Button */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-1 right-1 w-8 h-8 bg-[#163A5F] hover:bg-[#2563EB] text-white rounded-full shadow-md border-2 border-white transition-all flex items-center justify-center cursor-pointer"
                title="Upload & Crop Photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Remove Photo Button */}
              {effectivePhoto && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingPhoto}
                  className="absolute top-1 right-1 w-6 h-6 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-sm border border-rose-200 transition-colors flex items-center justify-center cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={KeyRound}
                onClick={() => setPasswordModalOpen(true)}
              >
                Change Password
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={handleOpenEditModal}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Name & Academic Meta */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold text-[#172554] tracking-tight">
                {profile?.name || user?.name}
              </h1>

              <Badge variant={isPlaced ? 'success' : 'secondary'} size="sm">
                {isPlaced ? `Placed at ${profile?.placedCompany?.name || 'Company'}` : 'Seeking Placement'}
              </Badge>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/25">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active • Verified Student
              </span>
            </div>

            {/* Sub-identity row with copyable Roll Number */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#64748B]">
              <div className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#163A5F] px-2.5 py-1 rounded-md border border-[#DBEAFE] font-mono font-bold">
                <span>{profile?.rollNumber || 'Roll No. Pending'}</span>
                {profile?.rollNumber && (
                  <button
                    type="button"
                    onClick={handleCopyRoll}
                    className="text-[#2563EB] hover:text-[#163A5F] transition-colors p-0.5 ml-0.5"
                    title="Copy Roll Number"
                  >
                    {copiedRoll ? <Check className="w-3.5 h-3.5 text-[#0D9488]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {profile?.department && (
                <span className="font-medium text-[#172554]">• {profile.department}</span>
              )}

              {profile?.batch && (
                <span className="font-medium text-[#64748B]">• Class of {profile.batch}</span>
              )}

              <span className="font-medium text-[#64748B] hidden md:inline">
                • {profile?.email || user?.email}
              </span>
            </div>
          </div>

          {/* Profile Completeness Checklist Bar */}
          <div className="mt-5 pt-4 border-t border-[#EFF6FF]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#172554] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                Profile Completeness Score
              </span>
              <span className="font-bold text-[#163A5F]">
                {completion.percentage}% Complete
              </span>
            </div>

            <div className="w-full bg-[#EFF6FF] rounded-full h-2 overflow-hidden border border-[#DBEAFE]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completion.percentage === 100
                    ? 'bg-[#0D9488]'
                    : completion.percentage >= 70
                    ? 'bg-[#2563EB]'
                    : 'bg-[#163A5F]'
                }`}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            {/* Checklist Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
              <span className="text-[11px] font-semibold text-[#64748B] mr-1">Checklist:</span>

              {/* Identification */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                <Check className="w-3 h-3" /> Identification
              </span>

              {/* CGPA */}
              {profile?.cgpa ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                  <Check className="w-3 h-3" /> CGPA & Scores
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  + Add CGPA
                </button>
              )}

              {/* Resume */}
              {profile?.resumeUrl ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                  <Check className="w-3 h-3" /> Resume PDF
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  + Upload Resume
                </button>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                  <Check className="w-3 h-3" /> Skills ({profile.skills.length})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  + Add Skills
                </button>
              )}

              {/* Contact Phone */}
              {profile?.phone ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                  <Check className="w-3 h-3" /> Phone
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  + Add Phone
                </button>
              )}

              {/* Links */}
              {profile?.githubUrl || profile?.linkedinUrl ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                  <Check className="w-3 h-3" /> Profiles
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  + Add Links
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. THE 6 STRUCTURED SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Cards 1, 2, 4, 5: 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* CARD 1: Personal Information */}
          <Card
            title="1. Personal Information"
            subtitle="Student identification and university placement registration standing"
            action={
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                Edit
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-[#2563EB]" />
                  Full Legal Name
                </span>
                <p className="text-xs font-bold text-[#172554]">
                  {profile?.name || user?.name || '—'}
                </p>
              </div>

              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
                    University Roll Number
                  </span>
                  <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium bg-white px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                    <Lock className="w-2.5 h-2.5 text-[#2563EB]" /> Locked
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold font-mono text-[#163A5F]">
                    {profile?.rollNumber || '—'}
                  </p>
                  {profile?.rollNumber && (
                    <button
                      type="button"
                      onClick={handleCopyRoll}
                      className="text-xs text-[#2563EB] hover:underline"
                    >
                      {copiedRoll ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                  Department / Branch
                </span>
                <p className="text-xs font-bold text-[#172554]">
                  {profile?.department || 'Not selected'}
                </p>
              </div>

              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                  Graduation Batch
                </span>
                <p className="text-xs font-bold text-[#172554]">
                  {profile?.batch ? `Class of ${profile.batch}` : 'Not selected'}
                </p>
              </div>
            </div>
          </Card>

          {/* CARD 2: Academic Information */}
          <Card
            title="2. Academic Information"
            subtitle="Verified academic scores evaluated against campus recruitment cutoff criteria"
            action={
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                Update Scores
              </button>
            }
          >
            {/* Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                  CGPA
                </span>
                <p className="text-xl font-bold text-[#163A5F]">
                  {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : '—'}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Scale: 10.0</p>
              </div>

              <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                  Active Backlogs
                </span>
                <p className="text-xl font-bold text-[#172554]">
                  {profile?.activeBacklogs ?? 0}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  {(profile?.activeBacklogs ?? 0) === 0 ? (
                    <span className="text-[#0D9488] font-semibold">All Clear</span>
                  ) : (
                    `${profile?.totalBacklogs ?? profile?.activeBacklogs ?? 0} Total Backlogs`
                  )}
                </p>
              </div>

              <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                  10th Board Marks
                </span>
                <p className="text-xl font-bold text-[#172554]">
                  {profile?.tenthPercentage ? `${profile.tenthPercentage}%` : '—'}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Secondary School</p>
              </div>

              <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                  12th / Diploma Marks
                </span>
                <p className="text-xl font-bold text-[#172554]">
                  {profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : '—'}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Higher Secondary</p>
              </div>
            </div>

            <div className="mt-3.5 p-2.5 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Academic standing is continuously synced with the placement eligibility verification engine.</span>
              <span className="font-semibold text-[#163A5F]">Total Backlogs: {profile?.totalBacklogs ?? 0}</span>
            </div>
          </Card>

          {/* CARD 4: Skills and Technical Information */}
          <Card
            title="4. Skills & Technical Information"
            subtitle="Programming languages, developer frameworks, libraries, and engineering tools"
            action={
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                + Manage Skills
              </button>
            }
          >
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F0F7FF] text-[#172554] border border-[#DBEAFE] hover:border-[#2563EB] transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-[#2563EB]" />
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-[#DBEAFE] rounded-xl text-xs text-[#64748B] bg-[#F0F7FF]">
                <Code className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-[#172554]">No technical skills declared yet</p>
                <p className="mt-0.5">Add your technical skillset to enhance eligibility and company matches.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleOpenEditModal}
                >
                  + Add Technical Skills
                </Button>
              </div>
            )}
          </Card>

          {/* CARD 5: Resume and Documents */}
          <Card
            title="5. Resume & Documents"
            subtitle="Official PDF resume document submitted automatically during campus drive applications"
          >
            {profile?.resumeUrl ? (
              <div className="p-4 rounded-xl border border-[#DBEAFE] bg-[#F0F7FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#163A5F] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#172554] truncate max-w-xs sm:max-w-sm">
                      {profile.resumeOriginalName || 'Student_Verified_Resume.pdf'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      PDF Document • {formatFileSize(profile.resumeSize)}
                      {profile.resumeUpdatedAt && (
                        <span> • Uploaded {new Date(profile.resumeUpdatedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-shrink-0 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={handleParseExistingResume}
                    isLoading={parsingResume}
                    className="border-[#93C5FD] text-[#2563EB] hover:bg-white"
                  >
                    Auto-Fill Profile
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadResume}
                  >
                    Download
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ExternalLink}
                    onClick={handlePreviewResume}
                  >
                    Preview
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                  >
                    {uploadingResume ? 'Replacing...' : 'Replace PDF'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#DBEAFE] rounded-xl p-6 text-center hover:border-[#2563EB] transition-colors bg-[#F0F7FF]">
                <FileText className="w-10 h-10 text-[#2563EB] mx-auto mb-2 opacity-80" />
                <h4 className="text-xs font-bold text-[#172554]">
                  No resume document uploaded yet
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Upload your professional PDF resume (max 5 MB). This file is automatically attached when you apply for placement drives.
                </p>

                <div className="mt-3.5">
                  <Button
                    type="button"
                    size="sm"
                    icon={Upload}
                    isLoading={uploadingResume}
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    Choose PDF Resume
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleResumeFileChange}
            />

            <p className="text-[11px] text-[#64748B] mt-3">
              Note: Only PDF format (.pdf) files under 5 MB are accepted for campus recruitment compliance.
            </p>
          </Card>
        </div>

        {/* Right Column (Cards 3, 6: 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 3: Contact Information */}
          <Card
            title="3. Contact Information"
            subtitle="Verified email, phone contact, and professional web presence"
            action={
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] hover:underline"
              >
                Edit
              </button>
            }
          >
            <div className="space-y-3">
              {/* College Email */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                    College Email Address
                  </span>
                  <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium bg-white px-1.5 py-0.5 rounded border border-[#DBEAFE]">
                    <Lock className="w-2.5 h-2.5 text-[#2563EB]" /> Locked
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#172554] truncate">
                  {profile?.email || user?.email || '—'}
                </p>
              </div>

              {/* Phone Number */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                  Contact Mobile Phone
                </span>
                <p className="text-xs font-semibold text-[#172554]">
                  {profile?.phone || (
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="text-[#2563EB] hover:underline font-normal text-xs"
                    >
                      + Add Phone Number
                    </button>
                  )}
                </p>
              </div>

              {/* GitHub Link */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#172554] flex-shrink-0">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-[#64748B] block">GitHub Profile</span>
                    {profile?.githubUrl ? (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#2563EB] hover:underline truncate block"
                      >
                        {profile.githubUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-xs text-[#64748B] italic">Not connected</span>
                    )}
                  </div>
                </div>
                {profile?.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-[#64748B] hover:text-[#172554] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* LinkedIn Link */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-[#64748B] block">LinkedIn Profile</span>
                    {profile?.linkedinUrl ? (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#2563EB] hover:underline truncate block"
                      >
                        {profile.linkedinUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-xs text-[#64748B] italic">Not connected</span>
                    )}
                  </div>
                </div>
                {profile?.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-[#64748B] hover:text-[#172554] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* CARD 6: Account and Security Settings */}
          <Card
            title="6. Account & Security Settings"
            subtitle="Password credentials, recovery verification, and authentication security"
          >
            <div className="space-y-3">
              {/* Password Setting Tile */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-sm flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">Account Password</h4>
                    <p className="text-[11px] text-[#64748B]">Protected by bcrypt hashing</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={KeyRound}
                  onClick={() => setPasswordModalOpen(true)}
                >
                  Change
                </Button>
              </div>

              {/* Security Questions Recovery Status */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#0D9488] shadow-sm flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">Security Questions</h4>
                    <p className="text-[11px] text-[#64748B]">Configured at registration for recovery</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded border border-[#0D9488]/20">
                  Active
                </span>
              </div>

              {/* Session / Account Status */}
              <div className="p-3 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">Account Status</h4>
                    <p className="text-[11px] text-[#64748B]">Active Student • Placement Enrolled</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0D9488]">
                  Verified
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* Profile Picture View Modal */}
      <ProfilePictureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={{
          name: profile?.name || user?.name,
          email: profile?.email || user?.email,
          profilePhoto: profile?.profilePhoto || user?.profilePhoto,
          role: 'student',
        }}
      />

      {/* Interactive Crop Modal */}
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

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Profile"
        subtitle="Update personal contact details, academic scores, and technical skills"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Smart Resume Auto-Fill Banner */}
          {profile?.resumeUrl && (
            <div className="p-3 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE]/40 border border-[#93C5FD] rounded-xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#163A5F]">Smart Resume Auto-Fill</h4>
                  <p className="text-[11px] text-[#475569] truncate">
                    Extract skills, marks, phone, and links directly from your PDF resume
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={handleParseExistingResume}
                isLoading={parsingResume}
                className="bg-white hover:bg-[#F0F7FF] text-[#2563EB] border-[#93C5FD] flex-shrink-0 text-xs font-semibold"
              >
                Scan Resume
              </Button>
            </div>
          )}

          {/* Section A: Personal Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#163A5F] uppercase tracking-wider pb-1.5 border-b border-[#DBEAFE]">
              1. Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Legal Name"
                name="name"
                icon={User}
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                required
              />

              <Input
                label="Contact Phone Number"
                name="phone"
                type="tel"
                placeholder="e.g. +91 9876543210"
                icon={Phone}
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                helperText="Shared with recruiters upon shortlisting"
              />
            </div>

            <div className="p-2.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-[11px] text-[#64748B] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
              <span>College Email (<strong>{profile?.email}</strong>) and Roll Number (<strong>{profile?.rollNumber}</strong>) are permanent institutional records and cannot be altered.</span>
            </div>
          </div>

          {/* Section B: Academic Records */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#163A5F] uppercase tracking-wider pb-1.5 border-b border-[#DBEAFE]">
              2. Academic Performance & Backlogs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#172554] mb-1.5">
                  Department / Discipline <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#DBEAFE] text-xs py-2 px-3 focus:outline-none focus:border-[#2563EB] bg-white text-[#172554]"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172554] mb-1.5">
                  Graduation Year (Batch) <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#DBEAFE] text-xs py-2 px-3 focus:outline-none focus:border-[#2563EB] bg-white text-[#172554]"
                >
                  <option value="">Select Graduation Year</option>
                  {GRADUATION_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      Class of {yr}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Cumulative CGPA (0.00 - 10.00)"
                name="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.25"
                value={formData.cgpa}
                onChange={handleInputChange}
                error={errors.cgpa}
                required
              />

              <Input
                label="Active Backlogs"
                name="activeBacklogs"
                type="number"
                min="0"
                placeholder="0"
                value={formData.activeBacklogs}
                onChange={handleInputChange}
                error={errors.activeBacklogs}
                required
                helperText="Currently uncleared subjects"
              />

              <Input
                label="Total Historical Backlogs"
                name="totalBacklogs"
                type="number"
                min="0"
                placeholder="0"
                value={formData.totalBacklogs}
                onChange={handleInputChange}
                error={errors.totalBacklogs}
                helperText="Total backlogs across all semesters"
              />

              <Input
                label="10th Standard Marks (%)"
                name="tenthPercentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 85.0"
                value={formData.tenthPercentage}
                onChange={handleInputChange}
                error={errors.tenthPercentage}
              />

              <div className="sm:col-span-2">
                <Input
                  label="12th / Diploma Marks (%)"
                  name="twelfthPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 82.5"
                  value={formData.twelfthPercentage}
                  onChange={handleInputChange}
                  error={errors.twelfthPercentage}
                />
              </div>
            </div>
          </div>

          {/* Section C: Technical Skills */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#163A5F] uppercase tracking-wider pb-1.5 border-b border-[#DBEAFE]">
              3. Technical Skills
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill (e.g. React, Python, Docker)..."
                icon={Code}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => handleAddSkill()}
              >
                Add
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]">
              <span className="text-[11px] text-[#64748B]">Quick add:</span>
              {COMMON_SKILLS.filter(
                (s) => !formData.skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
              )
                .slice(0, 6)
                .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#F0F7FF] border border-[#DBEAFE] hover:bg-[#EFF6FF] text-[#2563EB] transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
            </div>

            {/* Active Skills List */}
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#163A5F] border border-[#DBEAFE]"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#64748B] hover:text-[#DC2626] focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section D: Portfolio Links */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#163A5F] uppercase tracking-wider pb-1.5 border-b border-[#DBEAFE]">
              4. Professional Links
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="GitHub Profile URL"
                name="githubUrl"
                placeholder="https://github.com/username"
                icon={Github}
                value={formData.githubUrl}
                onChange={handleInputChange}
                error={errors.githubUrl}
              />
              <Input
                label="LinkedIn Profile URL"
                name="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                icon={Linkedin}
                value={formData.linkedinUrl}
                onChange={handleInputChange}
                error={errors.linkedinUrl}
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#DBEAFE]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saving}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI RESUME PARSER & AUTO-FILL MODAL */}
      <Modal
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        title="Resume Profile Extraction"
        subtitle="Review the verified credentials and competencies detected from your resume PDF"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-gradient-to-r from-[#EFF6FF] via-[#F0F7FF] to-[#DBEAFE]/30 rounded-xl border border-[#BFDBFE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#163A5F] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-[#60A5FA]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#163A5F]">
                  Extraction Complete
                </h4>
                <p className="text-[11px] text-[#64748B]">
                  Select the detected items you want to apply to your official placement profile.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#2563EB] bg-white px-2.5 py-1 rounded-full border border-[#BFDBFE] shadow-2xs">
              {parsedData?.skills?.length || 0} Skills Detected
            </span>
          </div>

          {/* Academic & Department Details */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-[#163A5F] uppercase tracking-wider">
              Academic Credentials
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Department */}
              {parsedData?.department && (
                <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.department ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    checked={selectedFields.department}
                    onChange={(e) => setSelectedFields(prev => ({ ...prev, department: e.target.checked }))}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#64748B] block">Department / Branch</span>
                    <span className="text-xs font-bold text-[#172554]">{parsedData.department}</span>
                  </div>
                </label>
              )}

              {/* CGPA */}
              {parsedData?.cgpa !== null && parsedData?.cgpa !== undefined && (
                <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.cgpa ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    checked={selectedFields.cgpa}
                    onChange={(e) => setSelectedFields(prev => ({ ...prev, cgpa: e.target.checked }))}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#64748B] block">Cumulative CGPA</span>
                    <span className="text-xs font-bold text-[#172554]">{parsedData.cgpa} / 10.0</span>
                  </div>
                </label>
              )}

              {/* 10th Percentage */}
              {parsedData?.tenthPercentage && (
                <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.tenthPercentage ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    checked={selectedFields.tenthPercentage}
                    onChange={(e) => setSelectedFields(prev => ({ ...prev, tenthPercentage: e.target.checked }))}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#64748B] block">10th / SSC Board Marks</span>
                    <span className="text-xs font-bold text-[#172554]">{parsedData.tenthPercentage}%</span>
                  </div>
                </label>
              )}

              {/* 12th / Diploma */}
              {parsedData?.twelfthPercentage && (
                <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.twelfthPercentage ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    checked={selectedFields.twelfthPercentage}
                    onChange={(e) => setSelectedFields(prev => ({ ...prev, twelfthPercentage: e.target.checked }))}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#64748B] block">12th / Diploma Marks</span>
                    <span className="text-xs font-bold text-[#172554]">{parsedData.twelfthPercentage}%</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Contact & Social Links */}
          {(parsedData?.phone || parsedData?.githubUrl || parsedData?.linkedinUrl) && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold text-[#163A5F] uppercase tracking-wider">
                Contact & Professional Profiles
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {parsedData?.phone && (
                  <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.phone ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                      checked={selectedFields.phone}
                      onChange={(e) => setSelectedFields(prev => ({ ...prev, phone: e.target.checked }))}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#64748B] block">Mobile Phone</span>
                      <span className="text-xs font-bold text-[#172554]">{parsedData.phone}</span>
                    </div>
                  </label>
                )}

                {parsedData?.githubUrl && (
                  <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.githubUrl ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                      checked={selectedFields.githubUrl}
                      onChange={(e) => setSelectedFields(prev => ({ ...prev, githubUrl: e.target.checked }))}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#64748B] block">GitHub</span>
                      <span className="text-xs font-bold text-[#172554] truncate block">{parsedData.githubUrl}</span>
                    </div>
                  </label>
                )}

                {parsedData?.linkedinUrl && (
                  <label className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${selectedFields.linkedinUrl ? 'bg-[#F0F7FF] border-[#2563EB]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                      checked={selectedFields.linkedinUrl}
                      onChange={(e) => setSelectedFields(prev => ({ ...prev, linkedinUrl: e.target.checked }))}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#64748B] block">LinkedIn</span>
                      <span className="text-xs font-bold text-[#172554] truncate block">{parsedData.linkedinUrl}</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Technical Skills Section */}
          {parsedData?.skills && parsedData.skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-bold text-[#163A5F] uppercase tracking-wider">
                  Technical Skills ({selectedSkills.length} of {parsedData.skills.length} selected)
                </h5>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSkills([...parsedData.skills])}
                    className="text-[11px] text-[#2563EB] hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-[#CBD5E1]">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkills([])}
                    className="text-[11px] text-[#64748B] hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {parsedData.skills.map((skill) => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkillSelection(skill)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isChecked
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-white text-[#475569] border border-[#CBD5E1] hover:border-[#94A3B8]'
                      }`}
                    >
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAutoFillModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Sparkles}
              isLoading={saving}
              onClick={handleApplyParsedData}
            >
              Apply Selected Details
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProfile;
