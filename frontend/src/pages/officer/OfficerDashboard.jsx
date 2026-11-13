import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CheckCircle,
  Building2,
  TrendingUp,
  PlusCircle,
  FileText,
  ArrowRight,
  Award,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { driveService } from '../../services/driveService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLPA, formatDate } from '../../utils/formatters';

const OfficerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDrives, setRecentDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, drivesRes] = await Promise.all([
          studentService.getStats(),
          driveService.getAllDrives(),
        ]);
        setStats(statsRes.stats);
        setRecentDrives(drivesRes.drives || []);
      } catch (err) {
        console.error('Failed to load officer dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling placement analytics & drives..." />;
  }

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Cell Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Academic Year 2025–2026 • Campus Placement Cell Administration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/officer/drives">
            <Button size="sm" icon={PlusCircle}>
              Schedule New Drive
            </Button>
          </Link>
          <Link to="/officer/companies">
            <Button variant="outline" size="sm" icon={Building2}>
              Add Company
            </Button>
          </Link>
          <Link to="/officer/applications">
            <Button variant="secondary" size="sm" icon={CheckCircle}>
              Review Applicants
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Registered</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalStudents || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Students Placed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {stats?.placedStudents || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Placement Ratio</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {stats?.placementRate || 0}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Active Drives</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.activeDrives || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Applications Filed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalApplications || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Department Performance + Active Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown Table (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Department Placement Analytics"
            subtitle="Batch-wise distribution and conversion rate"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="pb-3 pl-1">Department</th>
                    <th className="pb-3 text-center">Registered</th>
                    <th className="pb-3 text-center">Placed</th>
                    <th className="pb-3 text-center">Average CGPA</th>
                    <th className="pb-3 text-right pr-1">Placement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.deptStats?.length > 0 ? (
                    stats.deptStats.map((dept) => {
                      const rate =
                        dept.total > 0
                          ? Math.round((dept.placed / dept.total) * 100)
                          : 0;
                      return (
                        <tr key={dept._id} className="hover:bg-slate-50/70">
                          <td className="py-3 pl-1 font-semibold text-slate-900">
                            {dept._id || 'Unassigned'}
                          </td>
                          <td className="py-3 text-center text-slate-700 font-medium">
                            {dept.total}
                          </td>
                          <td className="py-3 text-center text-emerald-600 font-semibold">
                            {dept.placed}
                          </td>
                          <td className="py-3 text-center text-slate-600">
                            {dept.avgCgpa ? dept.avgCgpa.toFixed(2) : 'N/A'}
                          </td>
                          <td className="py-3 pr-1 text-right">
                            <span className="font-semibold text-blue-600">{rate}%</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No student department statistics available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Drives Sidebar (1 col) */}
        <div>
          <Card
            title="Active Placement Drives"
            subtitle="Campus schedule"
            action={
              <Link
                to="/officer/drives"
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Manage all
              </Link>
            }
          >
            <div className="space-y-3">
              {recentDrives.slice(0, 5).map((drive) => (
                <div
                  key={drive._id}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        {drive.company?.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{drive.jobRole}</p>
                    </div>
                    <Badge status={drive.status} size="sm" />
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatLPA(drive.packageLPA)}</span>
                    <Link
                      to={`/officer/applications?driveId=${drive._id}`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {drive.applicantCount ?? 0} applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;

