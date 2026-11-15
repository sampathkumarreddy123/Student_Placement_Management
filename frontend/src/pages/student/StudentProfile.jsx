import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Hash,
  BookOpen,
  GraduationCap,
  Percent,
  Phone,
  Link as LinkIcon,
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
  Layers,
  Sparkles,
  RotateCcw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useToast } from '../../context/ToastContext';

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
  const { user, updateUserProfile } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  // Profile data
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, items: [] });

  // Editable Form Data (no pre-filled dummy credentials or phone numbers)
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
  const [resendingVerification, setResendingVerification] = useState(false);
  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);

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

  const handleResendVerification = async () => {
    try {
      setResendingVerification(true);
      const res = await authService.resendVerification(profile?.email || user?.email);
      toast.success(res.message || 'Verification link sent to your college email.');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to dispatch verification link.'
      );
    } finally {
      setResendingVerification(false);
    }
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

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
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
      toast.success('Academic and personal records saved successfully!');
      setNotification({
        type: 'success',
        text: 'Academic and personal records saved successfully!',
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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please choose an image file (JPG, PNG, WebP).');
      setNotification({
        type: 'error',
        text: 'Please choose an image file (JPG, PNG, WebP).',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be smaller than 2 MB.');
      setNotification({
        type: 'error',
        text: 'Image size must be smaller than 2 MB.',
      });
      e.target.value = '';
      return;
    }

    try {
      setUploadingPhoto(true);
      setNotification(null);
      const data = new FormData();
      data.append('avatar', file);

      const res = await studentService.uploadAvatar(data);
      setProfile((prev) => ({ ...prev, profilePhoto: res.profilePhoto }));
      toast.success('Profile photo updated successfully!');
      setNotification({
        type: 'success',
        text: 'Profile photo updated successfully!',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to upload profile photo.');
      setNotification({
        type: 'error',
        text: err.message || 'Failed to upload profile photo.',
      });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDownloadResume = async () => {
    try {
      const response = await studentService.downloadResume();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', profile?.resumeOriginalName || 'Student_Resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded successfully.');
    } catch (err) {
      toast.error('Could not download resume.');
      setNotification({
        type: 'error',
        text: 'Could not download resume. Please verify the file is available.',
      });
    }
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        category="Student Profile"
        title="Academic & Placement Profile"
        subtitle="Manage verified student records, contact details, academic percentages, backlog declarations, and resume"
        badge={`${completion.percentage || 0}% Complete`}
        actions={
          <Button
            size="sm"
            variant="primary"
            icon={Edit3}
            onClick={handleOpenEditModal}
          >
            Edit Profile
          </Button>
        }
      />
      {/* Top Notification */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.text}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Unverified Email Warning Banner */}
      {!(profile?.isEmailVerified || user?.isEmailVerified) && (
        <div className="p-4 rounded-xl border border-[#D97706]/30 bg-[#F0F7FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#172554]">Email Verification Required</h4>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                Your college email (<strong>{profile?.email || user?.email}</strong>) is not yet verified. Unverified accounts cannot apply for placement drives.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs border-[#DBEAFE] text-[#172554] hover:bg-[#EFF6FF] flex-shrink-0"
            isLoading={resendingVerification}
            onClick={handleResendVerification}
            icon={Mail}
          >
            {resendingVerification ? 'Sending...' : 'Resend Verification Link'}
          </Button>
        </div>
      )}

      {/* Profile Header & Identity Card */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Core Identity */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border-2 border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-3xl shadow-sm overflow-hidden">
                {profile?.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile?.name || user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(profile?.name || user?.name || 'S').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Upload Photo Button */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm border-2 border-white transition-colors"
                title="Update Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#172554]">
                  {profile?.name || user?.name}
                </h1>
                <Badge variant={isPlaced ? 'success' : 'secondary'} size="sm">
                  {isPlaced ? `Placed at ${profile?.placedCompany?.name || 'Company'}` : 'Seeking Placement'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#64748B]">
                <span className="font-mono font-semibold text-[#163A5F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                  {profile?.rollNumber}
                </span>
                {profile?.department && (
                  <>
                    <span>•</span>
                    <span>{profile.department}</span>
                  </>
                )}
                {profile?.batch ? (
                  <>
                    <span>•</span>
                    <span>Class of {profile.batch}</span>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                  {profile?.email || user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                    {profile.phone}
                  </span>
                )}
                {/* Email Verification Status Badge */}
                {profile?.isEmailVerified || user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/25">
                    <CheckCircle2 className="w-3 h-3 text-[#0D9488]" />
                    Verified
                  </span>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/25">
                      <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                      Unverified
                    </span>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="text-[11px] font-semibold text-[#2563EB] underline hover:text-[#163A5F] disabled:opacity-50"
                    >
                      {resendingVerification ? 'Sending...' : 'Resend'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Button
              variant="primary"
              size="sm"
              icon={Edit3}
              onClick={handleOpenEditModal}
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-6 pt-5 border-t border-[#DBEAFE]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#172554] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              Profile Completion Status
            </span>
            <span className="font-bold text-[#172554]">
              {completion.percentage}% Complete
            </span>
          </div>

          <div className="w-full bg-[#DBEAFE] rounded-full h-2.5 overflow-hidden">
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

          {completion.percentage < 100 && (
            <p className="text-[11px] text-[#64748B] mt-2">
              Tip: Upload your verified PDF resume and complete your phone number & technical skills to unlock full drive eligibility.
            </p>
          )}
        </div>
      </div>

      {/* Main Profile Content: Clean View Cards */}
      <div className="space-y-6">
        {/* SECTION 1: Personal & Identification Information */}
        <Card
          title="Personal & College Identification"
          subtitle="Identity data verified for institutional recruitment tracking"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Edit3}
              onClick={handleOpenEditModal}
            >
              Edit Details
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-[#2563EB]" />
                Full Legal Name
              </span>
              <p className="text-sm font-bold text-[#172554]">
                {profile?.name || user?.name || '—'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                  College Email Address
                </span>
                <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[#2563EB]" /> Locked
                </span>
              </div>
              <p className="text-sm font-semibold text-[#172554] truncate">
                {profile?.email || user?.email || '—'}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Permanent institutional email address.
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
                  University Roll Number
                </span>
                <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[#2563EB]" /> Locked
                </span>
              </div>
              <p className="text-sm font-bold font-mono text-[#163A5F]">
                {profile?.rollNumber || '—'}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Permanent college registration identifier.
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                Contact Phone Number
              </span>
              <p className="text-sm font-semibold text-[#172554]">
                {profile?.phone || <span className="text-[#64748B] font-normal italic">Not provided yet</span>}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">
                Shared with recruiters upon candidate shortlisting.
              </p>
            </div>
          </div>
        </Card>

        {/* SECTION 2: Academic Performance & Criteria */}
        <Card
          title="Academic Records & Eligibility Metrics"
          subtitle="Verified academic scores used for placement drive cutoff filtering"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Edit3}
              onClick={handleOpenEditModal}
            >
              Edit Scores
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                Department / Discipline
              </span>
              <p className="text-sm font-bold text-[#172554] truncate">
                {profile?.department || 'Not selected'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                Graduation Batch
              </span>
              <p className="text-sm font-bold text-[#172554]">
                {profile?.batch ? `Class of ${profile.batch}` : 'Not selected'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                Cumulative CGPA
              </span>
              <p className="text-base font-bold text-[#163A5F]">
                {profile?.cgpa ? `${Number(profile.cgpa).toFixed(2)} / 10.0` : 'Not set'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#2563EB]" />
                Backlog Status
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-xs ${
                    (profile?.activeBacklogs ?? 0) > 0
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
                      : 'bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30'
                  }`}
                >
                  {profile?.activeBacklogs ?? 0} Active
                </span>
                <span className="text-xs text-[#64748B]">
                  ({profile?.totalBacklogs ?? profile?.activeBacklogs ?? 0} Total)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#DBEAFE]">
            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                10th Standard Board Percentage
              </span>
              <p className="text-sm font-bold text-[#172554]">
                {profile?.tenthPercentage ? `${profile.tenthPercentage}%` : <span className="text-[#64748B] font-normal italic">Not provided</span>}
              </p>
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE]">
              <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                12th / Diploma Board Percentage
              </span>
              <p className="text-sm font-bold text-[#172554]">
                {profile?.twelfthPercentage ? `${profile.twelfthPercentage}%` : <span className="text-[#64748B] font-normal italic">Not provided</span>}
              </p>
            </div>
          </div>
        </Card>

        {/* SECTION 3: Technical Skills Portfolio */}
        <Card
          title="Technical Skills"
          subtitle="Add frameworks, languages, and technical domains to your profile"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Edit3}
              onClick={handleOpenEditModal}
            >
              Manage Skills
            </Button>
          }
        >
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#163A5F] border border-[#DBEAFE]"
                >
                  <Code className="w-3.5 h-3.5 text-[#2563EB]" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-[#DBEAFE] rounded-xl text-xs text-[#64748B] bg-[#F0F7FF]">
              <p className="font-medium text-[#172554]">No technical skills listed yet</p>
              <p className="mt-1">Add your skills to improve company match scoring and drive eligibility.</p>
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

        {/* SECTION 4: Resume Document Management (PDF Only) */}
        <Card
          title="Resume Document (PDF Only)"
          subtitle="Official resume submitted to recruiters during campus drives"
        >
          <div className="space-y-4">
            {profile?.resumeUrl ? (
              <div className="p-4 rounded-xl border border-[#DBEAFE] bg-[#F0F7FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#163A5F] text-[#EFF6FF] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#172554] truncate max-w-xs sm:max-w-md">
                      {profile.resumeOriginalName || 'Student_Verified_Resume.pdf'}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      PDF Document • {formatFileSize(profile.resumeSize)}
                      {profile.resumeUpdatedAt && (
                        <span> • Uploaded {new Date(profile.resumeUpdatedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadResume}
                  >
                    Download
                  </Button>

                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#DBEAFE] text-xs font-medium text-[#172554] hover:bg-[#F0F7FF] gap-1"
                  >
                    Preview <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors"
                  >
                    {uploadingResume ? 'Replacing...' : 'Replace PDF'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#DBEAFE] rounded-xl p-8 text-center hover:border-[#2563EB] transition-colors bg-[#F0F7FF]">
                <FileText className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-[#172554]">
                  No resume document uploaded yet
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Upload your professional PDF resume (max 5 MB). This file is automatically shared with companies when you apply for drives.
                </p>

                <div className="mt-4">
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

            <p className="text-[11px] text-[#64748B]">
              Note: Only PDF format (.pdf) files up to 5 MB are permitted. Uploaded files undergo automatic server validation.
            </p>
          </div>
        </Card>

        {/* SECTION 5: Online Portfolios & Links */}
        <Card
          title="Professional Profiles & Portfolios"
          subtitle="Showcase your open source projects, code repositories, and networking profile"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Edit3}
              onClick={handleOpenEditModal}
            >
              Update Links
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#172554] flex-shrink-0">
                  <Github className="w-5 h-5" />
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
                      {profile.githubUrl}
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
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="p-3.5 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                  <Linkedin className="w-5 h-5" />
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
                      {profile.linkedinUrl}
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
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* SECTION 6: Account Security & Credentials */}
        <Card
          title="Account Security & Password"
          subtitle="Manage authentication credentials, password security, and college email verification"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#DBEAFE] bg-[#F0F7FF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#172554]">Account Password</h4>
                <p className="text-[11px] text-[#64748B]">
                  Update your password regularly to keep your student placement account secure.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={KeyRound}
              onClick={() => setPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </Card>
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* EDIT PROFILE POPUP MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Profile"
        subtitle="Update personal contact details, academic scores, and technical skills"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
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
    </div>
  );
};

export default StudentProfile;
