import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ExternalLink,
  GraduationCap,
  Award,
  BookOpen,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Placement Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access academic profiles, backlogs verification, resumes, and hiring milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="lg">
            Total Students: {students.length}
          </Badge>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              className="w-full h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
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
              className="w-full h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
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
              className="flex-1 h-[38px] rounded-lg border border-slate-200 text-xs px-3 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Any CGPA</option>
              <option value="7">CGPA &gt;= 7.0</option>
              <option value="8">CGPA &gt;= 8.0</option>
              <option value="8.5">CGPA &gt;= 8.5</option>
            </select>
            <Button type="submit" size="sm">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Querying registered student database..." />
      ) : students.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No students match filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Adjust your criteria to broaden results.
          </p>
        </Card>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Department & Batch</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Backlogs</th>
                  <th className="py-3 px-4">Skills</th>
                  <th className="py-3 px-4">Placement Status</th>
                  <th className="py-3 px-4 text-right">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((profile) => (
                  <tr key={profile._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {profile.user?.name || 'Student Name'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-blue-700 bg-blue-50 px-1 rounded">
                          {profile.rollNumber}
                        </span>
                        <span>•</span>
                        <span>{profile.user?.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{profile.department}</div>
                      <div className="text-[11px] text-slate-400">Class of {profile.batch}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900 text-sm">
                        {profile.cgpa ? profile.cgpa.toFixed(2) : '0.00'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-medium ${
                          profile.backlogs > 0
                            ? 'bg-rose-50 text-rose-700 font-semibold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {profile.backlogs}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {profile.skills?.slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills?.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{profile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={profile.placementStatus === 'Placed' ? 'success' : 'secondary'}
                        size="sm"
                      >
                        {profile.placementStatus === 'Placed'
                          ? `Placed @ ${profile.placedCompany?.name || 'Recruiter'}`
                          : 'Not Placed'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {profile.resumeUrl ? (
                        <a
                          href={profile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                        >
                          CV <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No CV</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ManageStudents;

