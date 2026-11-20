import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  Award,
  BookOpen,
  Code,
  Layers,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Copy,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import resumeIntelligenceService from '../../services/resumeIntelligenceService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  downloadBlobFile,
  previewBlobFile,
} from '../../utils/clientPdfGenerator';
import { studentService } from '../../services/studentService';

const AIResumeIntelligence = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Active view tab: 'report' or 'matching'
  const [activeTab, setActiveTab] = useState('report');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Data states
  const [resumeData, setResumeData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchCounts, setMatchCounts] = useState({ total: 0, best: 0, applied: 0 });

  // Job Matching Filters & Sorting
  const [matchFilter, setMatchFilter] = useState('all');
  const [matchSort, setMatchSort] = useState('match_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDriveId, setExpandedDriveId] = useState(null);

  // Copied summary state
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Selected match for breakdown modal
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'matching') {
      fetchMatches();
    }
  }, [activeTab, matchFilter, matchSort]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await resumeIntelligenceService.getAnalysis();
      setResumeData(res.resume || null);
      setAnalysis(res.analysis || null);
    } catch (err) {
      console.warn('[AIResumeIntelligence] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const res = await resumeIntelligenceService.getJobMatches({
        filter: matchFilter,
        sort: matchSort,
        search: searchQuery,
      });

      const allMatches = res.matches || [];
      setMatches(allMatches);

      // Calculate overview counts
      const best = allMatches.filter((m) => m.matchPercentage >= 70).length;
      const applied = allMatches.filter((m) => m.hasApplied).length;
      setMatchCounts({
        total: res.totalDrives || allMatches.length,
        best,
        applied,
      });
    } catch (err) {
      toast.error('Could not load placement drive matches.');
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    const isValid = validExts.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toast.error('Only PDF (.pdf) and Word documents (.docx) are supported.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume file size must be less than 5 MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const res = await resumeIntelligenceService.uploadResume(formData);
      setResumeData(res.resume);
      setAnalysis(res.analysis);
      toast.success('Resume uploaded and analyzed with AI successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload and analyze resume.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAnalyzeExisting = async () => {
    try {
      setAnalyzing(true);
      const res = await resumeIntelligenceService.analyzeResume();
      setAnalysis(res.analysis);
      toast.success('Resume analyzed successfully with updated intelligence!');
    } catch (err) {
      toast.error(err.message || 'Failed to analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await studentService.downloadResume();
      const ext = resumeData?.format === 'docx' ? 'docx' : 'pdf';
      downloadBlobFile(
        response,
        resumeData?.originalName || `Student_Resume.${ext}`,
        ext === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf'
      );
    } catch (err) {
      toast.error('Could not download resume file.');
    }
  };

  const handlePreview = async () => {
    try {
      const response = await studentService.downloadResume();
      previewBlobFile(response);
    } catch (err) {
      toast.error('Could not preview resume file.');
    }
  };

  const handleCopySummary = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Suggested summary copied to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#0D9488] bg-[#0D9488]/10 border-[#0D9488]/20';
    if (score >= 65) return 'text-[#2563EB] bg-[#2563EB]/10 border-[#2563EB]/20';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getMatchTierBadge = (pct) => {
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
          <Sparkles className="w-3.5 h-3.5" /> {pct}% • Strong Fit
        </span>
      );
    }
    if (pct >= 65) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
          {pct}% • Good Match
        </span>
      );
    }
    if (pct >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {pct}% • Moderate Fit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {pct}% • Skills Gap
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner text="Loading AI Resume Intelligence & Job Matching..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Resume Intelligence & Job Matching"
        subtitle="Extract technical competencies, audit resume readiness, and explore explainable match alignments with campus recruitment drives"
        action={
          resumeData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleAnalyzeExisting}
              isLoading={analyzing}
              className="bg-white hover:bg-[#F8FAFC] border-[#BFDBFE] text-[#2563EB]"
            >
              Re-Analyze Resume
            </Button>
          )
        }
      />

      {/* Top Resume Document Status Banner */}
      <Card>
        {resumeData ? (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#163A5F] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="w-6 h-6 text-[#93C5FD]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#172554] truncate">
                      {resumeData.originalName || 'Student_Resume.pdf'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#DBEAFE] text-[#163A5F]">
                      {resumeData.format || 'PDF'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                    {formatFileSize(resumeData.size)} • Uploaded {new Date(resumeData.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={handleDownload}
                  className="bg-white hover:bg-slate-50"
                >
                  Download
                </Button>

                {resumeData.format !== 'docx' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={ExternalLink}
                    onClick={handlePreview}
                  >
                    Preview
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white hover:bg-slate-50 border-[#93C5FD] text-[#2563EB]"
                >
                  {uploading ? 'Uploading...' : 'Replace Resume'}
                </Button>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#DBEAFE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                Document linked to student placement profile. Accepted formats: PDF (.pdf) and Word (.docx) up to 5 MB.
              </span>
              <span className="text-[11px] font-semibold text-[#163A5F]">
                Analysis Status: {analysis ? 'Ready & Synchronized' : 'Pending Analysis'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-[#BFDBFE] rounded-xl bg-[#F0F7FF]">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#BFDBFE] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Upload className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-sm font-bold text-[#172554]">
              Upload Your Resume to Activate AI Intelligence
            </h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-4">
              Upload your official PDF (.pdf) or Word document (.docx). The AI engine will audit your sections and automatically match your competencies against active placement drives.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploading}
            >
              Choose PDF or DOCX Resume
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFileUpload}
        />
      </Card>

      {/* Main Feature Tabs */}
      <div className="border-b border-[#DBEAFE] flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'report'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Resume Intelligence Report
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matching')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'matching'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            AI Job Matching Engine
            {matches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DBEAFE] text-[#163A5F]">
                {matches.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: RESUME INTELLIGENCE REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Disclaimer Notice */}
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#1E3A8A] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Advisory Quality Benchmark:</strong> This evaluation measures resume clarity, technical skill diversity, and structural completeness against campus recruitment standards. It is an advisory guide to strengthen your profile and does not represent an actual ATS score or guarantee recruitment selection.
                </div>
              </div>

              {/* Top Row: Overall Score & Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Overall Score Tile */}
                <div className="lg:col-span-4 p-5 bg-white border border-[#DBEAFE] rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Overall Quality Benchmark
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-5xl font-extrabold text-[#163A5F] tracking-tight">
                        {analysis.overallScore}
                      </span>
                      <span className="text-sm font-semibold text-[#64748B]">/ 100</span>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2563EB] to-[#0D9488] rounded-full transition-all duration-500"
                          style={{ width: `${analysis.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#DBEAFE] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Readiness Rating</span>
                      <span className="font-bold text-[#163A5F]">
                        {analysis.overallScore >= 80 ? 'Highly Competitive' : analysis.overallScore >= 65 ? 'Placement Ready' : 'Developmental'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Extracted Skills</span>
                      <span className="font-bold text-[#2563EB]">{analysis.extractedSkills?.all?.length || 0} Competencies</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Audited Sections</span>
                      <span className="font-bold text-[#0D9488]">8 of 8 Complete</span>
                    </div>
                  </div>
                </div>

                {/* Key Strengths & Weaknesses */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths Card */}
                  <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
                        Identified Strengths
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.strengths && analysis.strengths.length > 0 ? (
                        analysis.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-[#334155] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] mt-1.5 flex-shrink-0" />
                            <span>{str}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-[#64748B]">Solid educational foundation and student identification details.</li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses Card */}
                  <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
                        Areas for Improvement
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                        analysis.weaknesses.map((w, idx) => (
                          <li key={idx} className="text-xs text-[#334155] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-[#64748B]">All core sections are reasonably addressed. Continue refining metrics.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section-Wise Intelligence Breakdown */}
              <Card
                title="Section-Wise Quality Breakdown"
                subtitle="Detailed structural assessment across all core sections evaluated by technical recruiters"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {Object.entries(analysis.sectionAnalysis || {}).map(([key, sec]) => {
                    const titles = {
                      contactInfo: 'Contact & Links',
                      summary: 'Career Summary',
                      education: 'Education Details',
                      technicalSkills: 'Technical Skills',
                      projects: 'Project Portfolio',
                      experience: 'Internships & Work',
                      certifications: 'Certifications',
                      structureAndReadability: 'Readability & Layout',
                    };

                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#172554]">
                              {titles[key] || key}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScoreColor(
                                sec.score
                              )}`}
                            >
                              {sec.score}%
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            {sec.feedback}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
                          <span className="text-[#64748B]">Status</span>
                          <span className="font-semibold text-[#163A5F]">{sec.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Identified Skills Portfolio */}
              <Card
                title="Extracted Technical Competencies"
                subtitle="Categorized programming languages, developer frameworks, databases, and engineering tools discovered in your resume"
              >
                <div className="space-y-4">
                  {/* Languages */}
                  {analysis.extractedSkills?.languages?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#163A5F] block mb-2">
                        Programming Languages
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extractedSkills.languages.map((sk) => (
                          <span
                            key={sk}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Frameworks */}
                  {analysis.extractedSkills?.frameworks?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#163A5F] block mb-2">
                        Frameworks & Libraries
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extractedSkills.frameworks.map((sk) => (
                          <span
                            key={sk}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Databases */}
                  {analysis.extractedSkills?.databases?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#163A5F] block mb-2">
                        Databases & Storage
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extractedSkills.databases.map((sk) => (
                          <span
                            key={sk}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools & Cloud */}
                  {analysis.extractedSkills?.toolsAndCloud?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-[#163A5F] block mb-2">
                        Cloud & Engineering Tools
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extractedSkills.toolsAndCloud.map((sk) => (
                          <span
                            key={sk}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tailored Professional Summary Generator */}
              {analysis.sectionAnalysis?.summary?.suggestedSummary && (
                <Card
                  title="Suggested Professional Summary"
                  subtitle="Optimized 2-sentence career overview tailored to your verified technical skills"
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        handleCopySummary(analysis.sectionAnalysis.summary.suggestedSummary)
                      }
                      className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] flex items-center gap-1"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#0D9488]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSummary ? 'Copied' : 'Copy Text'}
                    </button>
                  }
                >
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <p className="text-xs font-medium text-[#1E293B] leading-relaxed italic">
                      "{analysis.sectionAnalysis.summary.suggestedSummary}"
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-2.5">
                      💡 Pro-tip: Paste this statement directly at the top of your resume beneath your contact header.
                    </p>
                  </div>
                </Card>
              )}

              {/* Actionable Learning Roadmap */}
              {analysis.recommendations?.prioritizedRoadmap && (
                <Card
                  title="Prioritized Placement Readiness Roadmap"
                  subtitle="Sequenced action milestones to elevate your profile for upcoming campus drives"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {analysis.recommendations.prioritizedRoadmap.map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-xl border border-[#DBEAFE] bg-white flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-6 h-6 rounded-full bg-[#163A5F] text-white text-xs font-bold flex items-center justify-center">
                              {item.step}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {item.priority} Priority
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#172554] mt-1 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <Sparkles className="w-10 h-10 text-[#2563EB] mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-bold text-[#172554]">
                  No Resume Intelligence Report Generated Yet
                </h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
                  Upload your resume to perform a multi-factor structural analysis and unlock personalized match recommendations.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Resume Document
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: AI JOB MATCHING ENGINE */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          {/* Engine Header & Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                Active Placement Drives
              </span>
              <p className="text-2xl font-extrabold text-[#163A5F]">
                {matchCounts.total}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Recruiting in campus portal</p>
            </div>

            <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                High Alignment Roles (&gt;= 70%)
              </span>
              <p className="text-2xl font-extrabold text-[#0D9488]">
                {matchCounts.best}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Recommended match fit</p>
            </div>

            <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs">
              <span className="text-[11px] font-medium text-[#64748B] block mb-1">
                Applied Opportunities
              </span>
              <p className="text-2xl font-extrabold text-[#2563EB]">
                {matchCounts.applied}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Submitted campus applications</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 bg-white border border-[#DBEAFE] rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { key: 'all', label: 'All Drives' },
                { key: 'best', label: 'Best Matches (≥ 70%)' },
                { key: 'applied', label: 'Applied' },
                { key: 'closing_soon', label: 'Closing Soon' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setMatchFilter(btn.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    matchFilter === btn.key
                      ? 'bg-[#163A5F] text-white shadow-xs'
                      : 'bg-[#F0F7FF] text-[#172554] border border-[#DBEAFE] hover:border-[#2563EB]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMatches()}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#DBEAFE] bg-[#F8FAFC] focus:outline-none focus:border-[#2563EB] focus:bg-white text-[#172554]"
                />
              </div>

              <select
                value={matchSort}
                onChange={(e) => setMatchSort(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#DBEAFE] bg-white text-[#172554] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="match_desc">Match % (High to Low)</option>
                <option value="match_asc">Match % (Low to High)</option>
                <option value="package_desc">Package LPA (High to Low)</option>
                <option value="deadline_asc">Closing Soonest</option>
              </select>
            </div>
          </div>

          {/* Drive Match Cards List */}
          {matchesLoading ? (
            <div className="py-16 flex items-center justify-center">
              <LoadingSpinner text="Computing explainable drive matches..." />
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((item) => {
                const drive = item.drive;
                const isExpanded = expandedDriveId === item.driveId;

                return (
                  <div
                    key={item.driveId}
                    className="p-5 bg-white border border-[#DBEAFE] rounded-xl shadow-xs hover:border-[#93C5FD] transition-all space-y-4"
                  >
                    {/* Top Row: Company, Role, Match Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#163A5F] flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {drive.company?.logo ? (
                            <img
                              src={drive.company.logo}
                              alt={drive.company.name}
                              className="w-full h-full object-contain p-1 rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-[#2563EB]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#64748B]">
                              {drive.company?.name || 'Recruiting Partner'}
                            </span>
                            {drive.isClosingSoon && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Closing Soon
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-[#172554] truncate">
                            {drive.jobRole}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {getMatchTierBadge(item.matchPercentage)}
                        <span className="text-sm font-bold text-[#163A5F] bg-[#F0F7FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                          {drive.packageLPA} LPA
                        </span>
                      </div>
                    </div>

                    {/* Meta Details: Location, Type, Skills */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                        {drive.location || 'Hybrid / On-Site'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                        {drive.employmentType || 'Full-Time'}
                      </span>
                      {drive.applicationClosingDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                          Deadline: {new Date(drive.applicationClosingDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Skill Comparison Badges */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[#172554] text-[11px] mr-1">
                          Matching Skills:
                        </span>
                        {item.matchingSkills && item.matchingSkills.length > 0 ? (
                          item.matchingSkills.map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            >
                              <Check className="w-3 h-3" /> {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#64748B] italic">No direct keyword overlap</span>
                        )}
                      </div>

                      {item.missingSkills && item.missingSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-semibold text-[#64748B] text-[11px] mr-1">
                            Skills to Strengthen:
                          </span>
                          {item.missingSkills.slice(0, 4).map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                            >
                              + {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Official Eligibility Status vs AI Match */}
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className={`w-4 h-4 ${
                            item.officialEligibility?.isEligible ? 'text-[#0D9488]' : 'text-amber-600'
                          }`}
                        />
                        <span className="font-semibold text-[#172554]">
                          Official Eligibility:{' '}
                          <span
                            className={
                              item.officialEligibility?.isEligible ? 'text-[#0D9488]' : 'text-amber-700'
                            }
                          >
                            {item.officialEligibility?.isEligible
                              ? 'Academic Cutoff Satisfied'
                              : item.officialEligibility?.reason}
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Governed by CGPA & branch criteria
                      </span>
                    </div>

                    {/* Expandable Explanation & Score Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-[#F0F7FF] rounded-xl border border-[#DBEAFE] space-y-3.5 animate-fadeIn">
                        <div>
                          <h4 className="text-xs font-bold text-[#163A5F] mb-1">
                            AI Alignment Explanation
                          </h4>
                          <p className="text-xs text-[#334155] leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>

                        {/* Weighted Breakdown Bars */}
                        <div>
                          <h4 className="text-xs font-bold text-[#163A5F] mb-2">
                            Score Breakdown (Weighted Factors)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                            <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center">
                              <span className="text-[10px] text-[#64748B] block">Skills (40%)</span>
                              <span className="font-bold text-[#163A5F]">
                                {item.scoreBreakdown?.technicalSkillsScore} / 40
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center">
                              <span className="text-[10px] text-[#64748B] block">Projects (25%)</span>
                              <span className="font-bold text-[#163A5F]">
                                {item.scoreBreakdown?.projectsScore} / 25
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center">
                              <span className="text-[10px] text-[#64748B] block">Experience (15%)</span>
                              <span className="font-bold text-[#163A5F]">
                                {item.scoreBreakdown?.experienceScore} / 15
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center">
                              <span className="text-[10px] text-[#64748B] block">Education (10%)</span>
                              <span className="font-bold text-[#163A5F]">
                                {item.scoreBreakdown?.educationScore} / 10
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-[#DBEAFE] text-center">
                              <span className="text-[10px] text-[#64748B] block">Certs (10%)</span>
                              <span className="font-bold text-[#163A5F]">
                                {item.scoreBreakdown?.certificationsScore} / 10
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interview Prep Topics */}
                        {item.preparationSuggestions && item.preparationSuggestions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-[#163A5F] mb-1.5">
                              Personalized Preparation Strategy
                            </h4>
                            <ul className="space-y-1">
                              {item.preparationSuggestions.map((prep, idx) => (
                                <li key={idx} className="text-xs text-[#334155] flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />
                                  <span>{prep}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDriveId(isExpanded ? null : item.driveId)
                        }
                        className="text-xs font-semibold text-[#2563EB] hover:text-[#163A5F] flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Hide Breakdown <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Match Breakdown <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link to={`/drives/${drive._id}`}>
                          <Button variant="outline" size="sm" className="bg-white">
                            View Drive Details
                          </Button>
                        </Link>

                        {item.hasApplied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : drive.isOpen && item.officialEligibility?.isEligible ? (
                          <Link to={`/drives/${drive._id}`}>
                            <Button variant="primary" size="sm">
                              Apply Now
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#64748B] px-2 py-1">
                            {!drive.isOpen ? 'Applications Closed' : 'Ineligible'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <Briefcase className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-[#172554]">
                  No Matching Placement Drives Found
                </h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
                  Try adjusting your filter selection or clear the search query to view active recruitment drives.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMatchFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResumeIntelligence;
