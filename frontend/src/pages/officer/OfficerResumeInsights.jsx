import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import resumeIntelligenceService from '../../services/resumeIntelligenceService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const OfficerResumeInsights = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  // Tab: 'skills' | 'students' | 'drives'
  const [activeTab, setActiveTab] = useState('skills');

  // Student Search & Filter states
  const [skillSearch, setSkillSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [minCgpaFilter, setMinCgpaFilter] = useState('');

  // Selected student analysis modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentModalData, setStudentModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Drive Match Explorer states
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [driveMatches, setDriveMatches] = useState(null);
  const [driveMatchesLoading, setDriveMatchesLoading] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await resumeIntelligenceService.getOfficerInsights();
      setInsights(res);
    } catch (err) {
      toast.error('Failed to load officer resume insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentModal = async (studentId) => {
    setSelectedStudentId(studentId);
    setModalLoading(true);
    try {
      const res = await resumeIntelligenceService.getOfficerStudentAnalysis(studentId);
      setStudentModalData(res);
    } catch (err) {
      toast.error('Could not load student resume analysis.');
      setSelectedStudentId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLoadDriveMatches = async (driveId) => {
    if (!driveId) return;
    setSelectedDriveId(driveId);
    setDriveMatchesLoading(true);
    try {
      const res = await resumeIntelligenceService.getOfficerDriveMatches(driveId);
      setDriveMatches(res);
    } catch (err) {
      toast.error('Failed to load drive candidate rankings.');
    } finally {
      setDriveMatchesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner text="Aggregating campus resume intelligence & skill demand..." />
      </div>
    );
  }

  // Filtered students from recentAnalyses
  const filteredStudents = (insights?.recentAnalyses || []).filter((s) => {
    const matchesDept =
      deptFilter === 'All Departments' || s.department === deptFilter;
    const matchesCgpa =
      !minCgpaFilter || Number(s.cgpa) >= Number(minCgpaFilter);
    const matchesSearch =
      !skillSearch ||
      s.name?.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(skillSearch.toLowerCase());
    return matchesDept && matchesCgpa && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Resume Insights & Skill Demand"
        subtitle="Analyze campus-wide technical skill distribution, audit student resume readiness, and explore drive-specific candidate alignments"
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B]">Total Enrolled</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-extrabold text-[#163A5F]">
            {insights?.kpis?.totalStudents || 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {insights?.kpis?.studentsWithResume || 0} resumes uploaded
          </p>
        </div>

        <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B]">Missing Resumes</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">
            {insights?.kpis?.studentsMissingResume || 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Students needing document submission</p>
        </div>

        <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B]">Average Quality Score</span>
            <Award className="w-4 h-4 text-[#0D9488]" />
          </div>
          <p className="text-2xl font-extrabold text-[#0D9488]">
            {insights?.kpis?.avgQualityScore || 0}%
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Campus benchmark readiness</p>
        </div>

        <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B]">Active Placement Drives</span>
            <Briefcase className="w-4 h-4 text-[#163A5F]" />
          </div>
          <p className="text-2xl font-extrabold text-[#163A5F]">
            {insights?.kpis?.activeDrivesCount || 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Recruiting in placement cycle</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#DBEAFE] flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Skill Demand vs Supply Analytics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <Users className="w-4 h-4" />
          Candidate Talent Explorer
        </button>
      </div>

      {/* TAB 1: SKILL DEMAND VS SUPPLY */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Top Demanded Skills List */}
            <div className="lg:col-span-7">
              <Card
                title="Top Recruiter Skill Demands"
                subtitle="Skills required across active campus recruitment drives compared against student acquisition rates"
              >
                <div className="space-y-3.5">
                  {insights?.topDemandedSkills && insights.topDemandedSkills.length > 0 ? (
                    insights.topDemandedSkills.map((item) => (
                      <div
                        key={item.skill}
                        className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#172554]">{item.skill}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#2563EB] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                              {item.driveDemandCount} Active Drives
                            </span>
                            <span className="text-[11px] text-[#0D9488] font-bold">
                              {item.studentCoveragePct}% Coverage
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar showing student coverage */}
                        <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#0D9488] rounded-full"
                            style={{ width: `${Math.min(100, item.studentCoveragePct)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] py-4 text-center">
                      No active drive skill requirements recorded yet.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Department Quality Averages */}
            <div className="lg:col-span-5">
              <Card
                title="Department Quality Benchmarks"
                subtitle="Average resume readiness score across engineering branches"
              >
                <div className="space-y-3">
                  {insights?.deptAverages && insights.deptAverages.length > 0 ? (
                    insights.deptAverages.map((dept) => (
                      <div
                        key={dept.department}
                        className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-[#172554]">
                            {dept.department}
                          </h4>
                          <p className="text-[10px] text-[#64748B]">
                            {dept.count} candidate resumes evaluated
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-[#163A5F] bg-white px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                          {dept.averageScore}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] py-4 text-center">
                      Department averages will appear once student resumes are evaluated.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE TALENT EXPLORER */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or roll number..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-[#DBEAFE] bg-[#F8FAFC] focus:outline-none focus:border-[#2563EB] focus:bg-white text-[#172554]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-[#DBEAFE] bg-white text-[#172554] focus:outline-none focus:border-[#2563EB]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.1"
                placeholder="Min CGPA (e.g. 7.5)"
                value={minCgpaFilter}
                onChange={(e) => setMinCgpaFilter(e.target.value)}
                className="text-xs w-32 px-3 py-2 rounded-lg border border-[#DBEAFE] bg-white text-[#172554] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white border border-[#DBEAFE] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Department & Batch</th>
                    <th className="py-3 px-4">Academic CGPA</th>
                    <th className="py-3 px-4">Quality Score</th>
                    <th className="py-3 px-4">Skills Extracted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s.studentId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#172554]">{s.name}</p>
                          <p className="text-[11px] text-[#64748B] font-mono">{s.rollNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-[#334155]">{s.department}</td>
                        <td className="py-3 px-4 font-bold text-[#163A5F]">
                          {s.cgpa ? Number(s.cgpa).toFixed(2) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              s.overallScore >= 80
                                ? 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {s.overallScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#2563EB]">
                            {s.extractedSkillsCount} Competencies
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={Sparkles}
                            onClick={() => handleOpenStudentModal(s.studentId)}
                            className="bg-white"
                          >
                            View Intelligence
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                        No candidate profiles match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT AI ANALYSIS MODAL */}
      <Modal
        isOpen={Boolean(selectedStudentId)}
        onClose={() => {
          setSelectedStudentId(null);
          setStudentModalData(null);
        }}
        title="Candidate AI Resume Intelligence"
        subtitle={
          studentModalData?.student?.name
            ? `${studentModalData.student.name} • ${studentModalData.profile?.rollNumber || ''}`
            : 'Resume Analysis Overview'
        }
        maxWidth="max-w-3xl"
      >
        {modalLoading ? (
          <div className="py-12 flex items-center justify-center">
            <LoadingSpinner text="Retrieving candidate resume analysis..." />
          </div>
        ) : studentModalData?.analysis ? (
          <div className="space-y-4">
            {/* Quality Summary */}
            <div className="p-4 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Resume Quality Score
                </span>
                <span className="text-3xl font-extrabold text-[#163A5F]">
                  {studentModalData.analysis.overallScore} / 100
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#2563EB] border border-[#BFDBFE]">
                {studentModalData.analysis.extractedSkills?.all?.length || 0} Skills Discovered
              </span>
            </div>

            {/* Extracted Skills */}
            <div>
              <h4 className="text-xs font-bold text-[#163A5F] mb-2 uppercase tracking-wider">
                Extracted Skills Portfolio
              </h4>
              <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                {studentModalData.analysis.extractedSkills?.all?.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#1E40AF] border border-[#BFDBFE]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#DBEAFE]">
                <h5 className="text-xs font-bold text-[#0D9488] mb-2">Strengths</h5>
                <ul className="space-y-1">
                  {studentModalData.analysis.strengths?.map((st, idx) => (
                    <li key={idx} className="text-[11px] text-[#334155] flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0D9488] flex-shrink-0 mt-0.5" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#DBEAFE]">
                <h5 className="text-xs font-bold text-amber-700 mb-2">Areas for Growth</h5>
                <ul className="space-y-1">
                  {studentModalData.analysis.weaknesses?.map((w, idx) => (
                    <li key={idx} className="text-[11px] text-[#334155] flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStudentId(null);
                  setStudentModalData(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No resume intelligence analysis found for this candidate.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OfficerResumeInsights;
