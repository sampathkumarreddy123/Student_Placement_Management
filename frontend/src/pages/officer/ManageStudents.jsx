import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ExternalLink,
  Eye,
  RotateCcw,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StudentProfileModal from '../../components/officer/StudentProfileModal';
import { getImageUrl, getResumeUrl } from '../../utils/imageUrl';
import {
  downloadBlobFile,
  previewBlobFile,
  isJsonErrorBlob,
} from '../../utils/clientPdfGenerator';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Student Profile Inspection Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);

  // Student Deletion state
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    const studentId = studentToDelete._id || studentToDelete.user?._id || studentToDelete.user;
    const name = studentToDelete.user?.name || studentToDelete.rollNumber || 'Student';

    try {
      setIsDeleting(true);
      const res = await studentService.deleteStudent(studentId);
      toast.success(res.message || `Student account for ${name} deleted successfully.`);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.includes('Resource not found')) {
        toast.error(
          'Cloud deployment is still building. Please wait 1-2 minutes for Render to finish deploying the latest commit.'
        );
      } else {
        toast.error(msg || 'Failed to delete student account.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreviewResume = async (profile) => {
    const studentId = profile._id || profile.user?._id || profile.user;
    const candidateName = profile.user?.name || profile.rollNumber || 'Candidate';

    if (!profile.resumeUrl) {
      toast.warning(`No resume document uploaded yet for ${candidateName}.`);
      return;
    }

    try {
      setPreviewingId(studentId);
      const res = await studentService.previewStudentResume(studentId);
      const isError = await isJsonErrorBlob(res.data);
      if (!isError && res.data && res.data.size > 100) {
        previewBlobFile(new Blob([res.data], { type: 'application/pdf' }));
        return;
      }
    } catch (err) {
      console.warn('Backend resume preview call failed:', err);
    } finally {
      setPreviewingId(null);
    }

    toast.error(`Original resume file is not available on server for ${candidateName}.`);
  };

  const handleDownloadResume = async (profile) => {
    const studentId = profile._id || profile.user?._id || profile.user;
    if (!studentId) return;
    const name = profile.user?.name || profile.rollNumber || 'Student';
    const filename = profile.resumeOriginalName || `${name.replace(/\s+/g, '_')}_Resume.pdf`;

    if (!profile.resumeUrl) {
      toast.warning(`No resume document uploaded yet for ${name}.`);
      return;
    }

    try {
      setDownloadingId(studentId);
      const res = await studentService.downloadStudentResume(studentId);
      const isError = await isJsonErrorBlob(res.data);
      if (!isError && res.data && res.data.size > 100) {
        downloadBlobFile(new Blob([res.data], { type: 'application/pdf' }), filename);
        toast.success(`Resume downloaded for ${name}.`);
        return;
      }
    } catch (err) {
      console.warn('Backend resume download call failed:', err);
    } finally {
      setDownloadingId(null);
    }

    toast.error(`Original resume file is not available on server for ${name}.`);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (department && department !== 'All Departments') params.department = department;
      if (statusFilter) params.placementStatus = statusFilter;
      if (minCgpa) params.minCgpa = minCgpa;

      const res = await studentService.getAllStudents(params);
      setStudents(res.students || []);
      setPage(1);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [department, statusFilter, minCgpa]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleReset = () => {
    setSearch('');
    setDepartment('All Departments');
    setStatusFilter('');
    setMinCgpa('');
    setPage(1);
  };

  const openStudentModal = (studentId) => {
    setSelectedStudentId(studentId);
    setIsProfileModalOpen(true);
  };

  // Pagination slice
  const totalCount = students.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, page, pageSize]);

  const hasActiveFilters =
    Boolean(search) ||
    department !== 'All Departments' ||
    Boolean(statusFilter) ||
    Boolean(minCgpa);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Consistent Page Header */}
      <PageHeader
        title="Student Placement Directory"
        subtitle="Verified academic records, backlogs evaluation, skills portfolios, and hiring milestones"
        category="Placement Cell Administration"
        badge={`${students.length} Registered Students`}
      />

      {/* 2. Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DBEAFE] shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Input
              placeholder="Search by student name or roll no..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              <option value="">All Placement Statuses</option>
              <option value="Placed">Placed</option>
              <option value="Not Placed">Seeking / Not Placed</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="flex-1 h-[38px] rounded-lg border border-[#DBEAFE] text-xs px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] bg-white text-[#172554]"
            >
              <option value="">Any CGPA Cutoff</option>
              <option value="6">CGPA &gt;= 6.0</option>
              <option value="7">CGPA &gt;= 7.0</option>
              <option value="8">CGPA &gt;= 8.0</option>
              <option value="8.5">CGPA &gt;= 8.5</option>
            </select>
            <Button type="submit" size="sm">
              Filter
            </Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleReset} title="Reset filters">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Table or Empty State */}
      {loading ? (
        <LoadingSpinner text="Querying registered student database..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students match criteria"
          description={
            hasActiveFilters
              ? 'No registered candidates match your active search or branch/CGPA filter parameters.'
              : 'There are currently no student accounts registered in the portal. Students must register through the registration page.'
          }
          actionText={hasActiveFilters ? 'Reset Filters' : undefined}
          onAction={hasActiveFilters ? handleReset : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F0F7FF] border-b border-[#DBEAFE] text-[#172554] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Student & Roll No</th>
                  <th className="py-3 px-4 min-w-[170px]">Department & Batch</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">CGPA</th>
                  <th className="py-3 px-4 text-center min-w-[80px]">Backlogs</th>
                  <th className="py-3 px-4 min-w-[160px]">Skills</th>
                  <th className="py-3 px-4 min-w-[130px]">Placement Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]/60">
                {paginatedStudents.map((profile) => (
                  <tr key={profile._id} className="hover:bg-[#F0F7FF] transition-colors">
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] font-bold text-xs flex-shrink-0 overflow-hidden shadow-sm">
                          {profile.profilePhoto || profile.user?.profilePhoto ? (
                            <img
                              src={getImageUrl(profile.profilePhoto || profile.user?.profilePhoto)}
                              alt={profile.user?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{profile.user?.name ? profile.user.name.charAt(0).toUpperCase() : 'S'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#172554] leading-tight truncate">
                            {profile.user?.name || 'Student Name'}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[#163A5F] bg-[#EFF6FF] border border-[#DBEAFE] px-1.5 py-0.2 rounded font-semibold">
                              {profile.rollNumber}
                            </span>
                            <span>•</span>
                            <span className="truncate">{profile.user?.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748B] min-w-[170px]">
                      <div className="font-medium text-[#172554]">{profile.department}</div>
                      <div className="text-[11px] text-[#64748B]/80">Class of {profile.batch}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center min-w-[80px]">
                      <span className="font-bold text-[#172554] text-sm">
                        {profile.cgpa ? profile.cgpa.toFixed(2) : '0.00'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center min-w-[80px]">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-medium ${
                          (profile.activeBacklogs || profile.backlogs || 0) > 0
                            ? 'bg-[#DC2626]/10 text-[#DC2626] font-semibold border border-[#DC2626]/30'
                            : 'bg-[#F0F7FF] border border-[#DBEAFE] text-[#172554]'
                        }`}
                      >
                        {profile.activeBacklogs || profile.backlogs || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex flex-wrap gap-1">
                        {profile.skills?.slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#EFF6FF] border border-[#DBEAFE] text-[#163A5F]"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills?.length > 3 && (
                          <span className="text-[10px] text-[#64748B] font-medium">
                            +{profile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 min-w-[130px]">
                      <Badge
                        variant={profile.placementStatus === 'Placed' ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {profile.placementStatus === 'Placed'
                          ? `Placed @ ${profile.placedCompany?.name || 'Recruiter'}`
                          : 'Seeking Placement'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => openStudentModal(profile.user?._id || profile.user)}
                          title="Inspect Student Profile"
                        >
                          Profile
                        </Button>
                        {profile.resumeUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreviewResume(profile)}
                              disabled={previewingId === (profile._id || profile.user?._id || profile.user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#163A5F] font-semibold hover:bg-[#DBEAFE] border border-[#DBEAFE] transition-colors text-xs disabled:opacity-50"
                              title="Show / Preview Resume in new tab"
                            >
                              CV <ExternalLink className="w-3 h-3 text-[#2563EB]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadResume(profile)}
                              disabled={downloadingId === (profile._id || profile.user?._id || profile.user)}
                              className="p-1.5 rounded-lg text-[#0D9488] hover:text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors disabled:opacity-50"
                              title="Download Candidate Resume"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(profile)}
                          className="p-1.5 rounded-lg text-[#DC2626] hover:text-[#B91C1C] hover:bg-[#DC2626]/10 transition-colors"
                          title="Delete Student Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Student Profile Inspection Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedStudentId(null);
        }}
        studentId={selectedStudentId}
        onDelete={(studentProfile) => setStudentToDelete(studentProfile)}
      />

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163A5F]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !isDeleting && setStudentToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#DBEAFE] w-full max-w-md p-6 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">
                  Delete Student Account
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Permanent removal from placement portal
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DBEAFE] space-y-1.5 text-xs text-[#172554]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Student Name:</span>
                <span className="font-bold">{studentToDelete.user?.name || studentToDelete.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Roll Number:</span>
                <span className="font-mono font-bold text-[#163A5F]">{studentToDelete.rollNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Department:</span>
                <span className="font-medium">{studentToDelete.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email Address:</span>
                <span className="font-medium truncate max-w-[200px]">{studentToDelete.user?.email || studentToDelete.email || 'N/A'}</span>
              </div>
            </div>

            <p className="text-xs text-[#DC2626] bg-[#DC2626]/5 p-2.5 rounded-lg border border-[#DC2626]/20 leading-relaxed">
              ⚠️ <strong>Warning:</strong> This action cannot be undone. All associated records (student profile, job applications, round submissions, and uploaded resumes) will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DBEAFE]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                isLoading={isDeleting}
                onClick={handleDeleteStudent}
              >
                {isDeleting ? 'Deleting...' : 'Delete Student Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
