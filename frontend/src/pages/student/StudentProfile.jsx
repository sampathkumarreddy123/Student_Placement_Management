import React, { useState, useEffect } from 'react';
import {
  User,
  Hash,
  BookOpen,
  GraduationCap,
  Percent,
  Phone,
  Link as LinkIcon,
  Code,
  Save,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const StudentProfile = () => {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: 'Computer Science',
    batch: 2026,
    cgpa: 7.5,
    backlogs: 0,
    tenthPercentage: 85,
    twelfthPercentage: 80,
    phone: '',
    resumeUrl: '',
    skills: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentService.getMyProfile();
        const p = res.profile;
        if (p) {
          setFormData({
            name: p.name || user?.name || '',
            rollNumber: p.rollNumber || '',
            department: p.department || 'Computer Science',
            batch: p.batch || 2026,
            cgpa: p.cgpa !== undefined ? p.cgpa : 7.5,
            backlogs: p.backlogs !== undefined ? p.backlogs : 0,
            tenthPercentage: p.tenthPercentage || 0,
            twelfthPercentage: p.twelfthPercentage || 0,
            phone: p.phone || '',
            resumeUrl: p.resumeUrl || '',
            skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await studentService.updateMyProfile(formData);
      setSuccessMsg('Academic profile saved successfully!');
      updateUserProfile(res.profile);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Profile & Academic Records</h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your academic performance and skills updated for automated drive eligibility
        </p>
      </div>

      {successMsg && (
        <Alert
          type="success"
          message={successMsg}
          onClose={() => setSuccessMsg('')}
        />
      )}

      {errorMsg && (
        <Alert
          type="error"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Identification Info */}
        <Card title="Personal & College Identification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="Rahul Verma"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Roll Number / Registration ID"
              name="rollNumber"
              placeholder="CS2026-042"
              icon={Hash}
              value={formData.rollNumber}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Department / Discipline *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Graduation Batch Year *
              </label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Academic Criteria & Performance */}
        <Card title="Academic Metrics & Eligibility Parameters">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Cumulative CGPA (0 - 10)"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="8.50"
              value={formData.cgpa}
              onChange={handleChange}
              required
              helperText="Verified in screening"
            />

            <Input
              label="Active Backlogs"
              name="backlogs"
              type="number"
              min="0"
              placeholder="0"
              value={formData.backlogs}
              onChange={handleChange}
              required
              helperText="Must match semester grade sheet"
            />

            <Input
              label="10th Percentage (%)"
              name="tenthPercentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="85.0"
              value={formData.tenthPercentage}
              onChange={handleChange}
            />

            <Input
              label="12th / Diploma (%)"
              name="twelfthPercentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="82.0"
              value={formData.twelfthPercentage}
              onChange={handleChange}
            />
          </div>
        </Card>

        {/* Contact & Portfolio */}
        <Card title="Contact & Credentials">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone Number"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              icon={Phone}
              value={formData.phone}
              onChange={handleChange}
            />

            <Input
              label="Resume URL (Google Drive / GitHub / Portfolio)"
              name="resumeUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              icon={LinkIcon}
              value={formData.resumeUrl}
              onChange={handleChange}
              helperText="Ensure link sharing is set to 'Anyone with link'"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Key Skills (comma separated)"
              name="skills"
              placeholder="React, Node.js, Python, Java, SQL, AWS, Data Structures"
              icon={Code}
              value={formData.skills}
              onChange={handleChange}
              helperText="Used to recommend and highlight matching placement drives"
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            isLoading={loading}
            icon={Save}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;

