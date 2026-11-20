import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  History,
  Trash2,
  FileSpreadsheet,
  ExternalLink,
  User,
  Building2,
  Briefcase,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronDown,
  Search,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { copilotService } from '../../services/copilotService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/csvExport';
import StudentProfileModal from '../../components/officer/StudentProfileModal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';

// Suggested Query Chips
const SUGGESTED_QUERIES = [
  'Find all students eligible for upcoming placement drives with uploaded resumes',
  'Show students who have not uploaded their resumes',
  'Which placement drives are closing within 7 days?',
  'Summarize applications currently pending review',
  'Generate this month\'s placement summary report',
  'Find CSE students with CGPA above 8.0 and React/Node skills',
  'Analyze technical skill gaps and student preparation readiness',
  'Prepare an announcement for the upcoming placement drive',
];

const OfficerCopilot = () => {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Conversation state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('online');

  // Selected student for Profile Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Action execution state
  const [executingAction, setExecutingAction] = useState(false);
  const [actionSuccessData, setActionSuccessData] = useState(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial load: Fetch conversations history & health
  useEffect(() => {
    loadHistory();
    copilotService
      .getHealth()
      .then((res) => {
        if (res.status) setHealthStatus(res.status);
      })
      .catch(() => setHealthStatus('ready'));
  }, []);

  const loadHistory = async () => {
    try {
      const res = await copilotService.getHistory();
      if (res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.warn('Failed to load history:', err.message);
    }
  };

  const handleSelectConversation = async (convId) => {
    try {
      setLoading(true);
      const res = await copilotService.getConversationById(convId);
      if (res.success && res.conversation) {
        setActiveConversationId(res.conversation.id);
        setMessages(res.conversation.messages || []);
        setHistoryOpen(false);
      }
    } catch (err) {
      toast.showError('Could not load selected conversation.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue('');
    setHistoryOpen(false);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await copilotService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
      toast.showSuccess('Conversation deleted.');
    } catch (err) {
      toast.showError('Failed to delete conversation.');
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all conversation history?')) return;

    try {
      await copilotService.clearAllHistory();
      setConversations([]);
      handleStartNewChat();
      toast.showSuccess('All conversation history cleared.');
    } catch (err) {
      toast.showError('Failed to clear history.');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    // Optimistically append user message
    const tempUserMsg = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await copilotService.sendMessage({
        message: query,
        conversationId: activeConversationId,
      });

      if (res.success && res.message) {
        if (!activeConversationId && res.conversationId) {
          setActiveConversationId(res.conversationId);
          loadHistory(); // Refresh sidebar list with new title
        }
        setMessages((prev) => [...prev, res.message]);
      } else {
        toast.showError(res.message || 'Copilot failed to generate a response.');
      }
    } catch (err) {
      console.error('Copilot send error:', err);
      const errMsg = {
        role: 'assistant',
        content: `Error: ${err.response?.data?.message || err.message || 'Failed to process request with database.'}`,
        responseType: 'ERROR',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Open Student Profile Modal
  const handleOpenStudentModal = (studentId) => {
    if (studentId) {
      setSelectedStudentId(studentId);
      setIsProfileModalOpen(true);
    }
  };

  // Execute staged administrative action
  const handleExecuteConfirmedAction = async (actionType, payload) => {
    if (!actionType || !payload) return;
    try {
      setExecutingAction(true);
      const res = await copilotService.executeAction({
        actionType,
        payload,
        conversationId: activeConversationId,
      });

      if (res.success) {
        toast.showSuccess(res.result?.message || 'Administrative action completed successfully.');
        setActionSuccessData(res.result);
        // Refresh active conversation to show action confirmation in transcript
        if (activeConversationId) {
          handleSelectConversation(activeConversationId);
        }
      }
    } catch (err) {
      toast.showError(err.response?.data?.message || err.message || 'Failed to execute administrative action.');
    } finally {
      setExecutingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* 1. TOP HEADER BAR */}
      <div className="bg-white rounded-2xl border border-[#DBEAFE] shadow-sm p-4 sm:p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#163A5F] via-[#1E4976] to-[#2563EB] text-white flex items-center justify-center shadow-md shadow-[#2563EB]/15 flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#172554] tracking-tight">
                AI Placement Officer Copilot
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live DB Verified
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Natural-language intelligence for student screening, eligibility rules, and automated administrative operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => setHistoryOpen(!historyOpen)}
            className="text-xs bg-white hover:bg-slate-50"
          >
            History ({conversations.length})
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleStartNewChat}
            className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
          >
            New Conversation
          </Button>
        </div>
      </div>

      {/* 2. WORKSPACE CONTAINER (MAIN CHAT + OPTIONAL HISTORY DRAWER) */}
      <div className="flex-1 flex gap-4 min-h-0 relative overflow-hidden">
        {/* CONVERSATION HISTORY DRAWER / SIDEBAR */}
        {historyOpen && (
          <div className="absolute inset-y-0 left-0 z-30 w-80 bg-white rounded-2xl border border-[#DBEAFE] shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-[#DBEAFE] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
                  Conversation Log
                </h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-[#64748B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-[#64748B]">
                  No previous conversations found.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConversationId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-[#EFF6FF] border-[#2563EB] text-[#163A5F]'
                          : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-[#172554]">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          {c.messageCount} message(s) •{' '}
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-rose-600 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {conversations.length > 0 && (
              <div className="p-3 border-t border-[#DBEAFE] bg-slate-50">
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="w-full py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All History
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. MAIN CHAT AREA */}
        <div className="flex-1 bg-white rounded-2xl border border-[#DBEAFE] shadow-sm flex flex-col overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              /* EMPTY WELCOMING STATE */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8">
                <div className="w-16 h-16 rounded-3xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] mb-4 shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#172554] tracking-tight">
                  How can I assist your placement operations today?
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-lg leading-relaxed">
                  I am directly connected to your MongoDB database. Ask natural language queries to screen students, check drive eligibility, analyze applicants, view deadlines, or draft official communications.
                </p>

                {/* SUGGESTED QUERY PILLS */}
                <div className="mt-6 w-full text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5 text-center">
                    Quick Suggestions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED_QUERIES.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        className="p-3 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#2563EB] text-left transition-all text-xs text-[#172554] font-medium flex items-center justify-between group"
                      >
                        <span className="line-clamp-2">{q}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MESSAGE BUBBLES */
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-[#163A5F] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  {/* Bubble Content */}
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-sm text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#163A5F] text-white rounded-tr-none'
                        : 'bg-[#F8FAFC] border border-[#DBEAFE] text-[#172554] rounded-tl-none'
                    }`}
                  >
                    {/* Role Header (Assistant only) */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-[#DBEAFE]">
                        <span className="font-bold text-[#163A5F] flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                          Copilot Intelligence
                        </span>
                        {msg.toolCalled && (
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#DBEAFE] text-[#64748B]">
                            {msg.toolCalled}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Conversational Text */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* STRUCTURED RESPONSE RENDERERS */}
                    {msg.data && (
                      <div className="mt-3.5 pt-3.5 border-t border-[#DBEAFE]/80">
                        {renderStructuredData({
                          responseType: msg.responseType,
                          data: msg.data,
                          onOpenStudent: handleOpenStudentModal,
                          onExecuteAction: handleExecuteConfirmedAction,
                          executingAction,
                        })}
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm mt-1">
                      {user?.name?.charAt(0).toUpperCase() || 'O'}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* LOADING STATE */}
            {loading && (
              <div className="flex gap-3 sm:gap-4 justify-start">
                <div className="w-9 h-9 rounded-xl bg-[#163A5F] text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-[#F8FAFC] border border-[#DBEAFE] rounded-2xl rounded-tl-none p-4 shadow-sm text-xs text-[#64748B] flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                  <span>Accessing MongoDB placement records and verifying eligibility rules...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 4. CHAT INPUT BAR */}
          <div className="p-3 sm:p-4 border-t border-[#DBEAFE] bg-white flex-shrink-0">
            <div className="relative rounded-2xl border border-[#DBEAFE] bg-[#F8FAFC] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 transition-all">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything (e.g. 'Find eligible CSE students for Java drive', 'Who has not uploaded resumes?'). Press Enter to send."
                disabled={loading}
                className="w-full bg-transparent px-4 py-3 text-xs sm:text-sm text-[#172554] placeholder-[#64748B] resize-none focus:outline-none"
              />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748B]">
                    Shift + Enter for new line
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {inputValue.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInputValue('')}
                      className="text-xs text-[#64748B] hover:text-[#172554] px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    disabled={!inputValue.trim() || loading}
                    onClick={() => handleSendMessage()}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT PROFILE DETAILS MODAL */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedStudentId(null);
        }}
        studentId={selectedStudentId}
      />
    </div>
  );
};

/**
 * Helper to render structured data based on Copilot responseType
 */
const renderStructuredData = ({
  responseType,
  data,
  onOpenStudent,
  onExecuteAction,
  executingAction,
}) => {
  if (!data) return null;

  // 1. STUDENT TABLE (Search or Eligibility Results)
  if (responseType === 'STUDENT_TABLE' || (data.students && Array.isArray(data.students))) {
    const students = data.students || [];

    const handleExport = () => {
      exportToCsv(
        'students_copilot_export',
        [
          { header: 'Roll Number', key: 'rollNumber' },
          { header: 'Full Name', key: 'name' },
          { header: 'Email Address', key: 'email' },
          { header: 'Department', key: 'department' },
          { header: 'CGPA', key: 'cgpa' },
          { header: 'Active Backlogs', key: 'activeBacklogs' },
          { header: 'Resume Status', accessor: (r) => (r.hasResume ? 'Uploaded' : 'Missing') },
          { header: 'Technical Skills', accessor: (r) => (Array.isArray(r.skills) ? r.skills.join('; ') : '') },
        ],
        students
      );
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#172554]">
              Candidate Records ({students.length})
            </span>
            {data.criteriaSummary && (
              <span className="text-[11px] text-[#64748B] hidden md:inline">
                • {data.criteriaSummary}
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExport}
            className="text-[11px] h-7 bg-white hover:bg-slate-50"
          >
            Export CSV
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#DBEAFE] bg-white text-center text-xs text-[#64748B]">
            No matching student records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DBEAFE] bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EFF6FF]/60 border-b border-[#DBEAFE] text-[#163A5F]">
                  <th className="p-2.5 font-bold">Student</th>
                  <th className="p-2.5 font-bold">Roll No</th>
                  <th className="p-2.5 font-bold">Dept</th>
                  <th className="p-2.5 font-bold text-center">CGPA</th>
                  <th className="p-2.5 font-bold">Skills</th>
                  <th className="p-2.5 font-bold text-center">Resume</th>
                  <th className="p-2.5 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]">
                {students.slice(0, 15).map((s) => (
                  <tr key={s.id || s.rollNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5">
                      <div className="font-semibold text-[#172554]">{s.name}</div>
                      <div className="text-[10px] text-[#64748B]">{s.email}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] font-bold text-[#163A5F]">
                      {s.rollNumber}
                    </td>
                    <td className="p-2.5 text-[#64748B]">{s.department}</td>
                    <td className="p-2.5 text-center font-bold text-[#172554]">
                      {s.cgpa?.toFixed ? s.cgpa.toFixed(2) : s.cgpa}
                    </td>
                    <td className="p-2.5 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {(s.skills || []).slice(0, 3).map((sk, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#EFF6FF] text-[#2563EB] font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                        {(s.skills || []).length > 3 && (
                          <span className="text-[10px] text-[#64748B]">
                            +{s.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      {s.hasResume ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenStudent(s.id)}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#163A5F] hover:bg-[#2563EB] text-white transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 15 && (
              <div className="p-2 bg-[#F8FAFC] border-t border-[#DBEAFE] text-center text-[11px] text-[#64748B]">
                Showing first 15 of {students.length} candidates. Click Export CSV to download complete dataset.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. PLACEMENT DRIVES TABLE
  if (responseType === 'DRIVE_TABLE' || (data.drives && Array.isArray(data.drives))) {
    const drives = data.drives || [];

    const handleExport = () => {
      exportToCsv(
        'drives_copilot_export',
        [
          { header: 'Title', key: 'title' },
          { header: 'Company', key: 'company' },
          { header: 'Job Role', key: 'jobRole' },
          { header: 'Package (LPA)', key: 'packageLPA' },
          { header: 'Status', key: 'status' },
          { header: 'Total Applicants', key: 'applicantsCount' },
          { header: 'Deadline', accessor: (d) => (d.deadline ? new Date(d.deadline).toLocaleDateString() : 'N/A') },
        ],
        drives
      );
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#172554]">
            Placement Drives ({drives.length})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExport}
            className="text-[11px] h-7 bg-white hover:bg-slate-50"
          >
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {drives.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl border border-[#DBEAFE] bg-white shadow-sm flex flex-col justify-between gap-3 hover:border-[#2563EB]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#172554]">{d.title}</h4>
                  <Badge variant={d.status === 'Published' ? 'success' : 'default'} size="sm">
                    {d.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="font-medium text-[#172554]">{d.company}</span>
                  <span>• {d.jobRole}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ₹{d.packageLPA} LPA
                  </span>
                  <span className="text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                    {d.applicantsCount || 0} Applicant(s)
                  </span>
                  {d.deadline && (
                    <span className="text-[#64748B] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2563EB]" />
                      Closes {new Date(d.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`/drives/${d.id}`}
                className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 self-end mt-1"
              >
                View Drive Details
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. APPLICATION TABLE
  if (responseType === 'APPLICATION_TABLE' || (data.applicants && Array.isArray(data.applicants)) || (data.applications && Array.isArray(data.applications))) {
    const list = data.applicants || data.applications || [];

    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#172554]">
          Application Records ({list.length})
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#DBEAFE] bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#EFF6FF]/60 border-b border-[#DBEAFE] text-[#163A5F]">
                <th className="p-2.5 font-bold">Candidate</th>
                <th className="p-2.5 font-bold">Roll No</th>
                <th className="p-2.5 font-bold">Target</th>
                <th className="p-2.5 font-bold text-center">Status</th>
                <th className="p-2.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBEAFE]">
              {list.slice(0, 12).map((a) => (
                <tr key={a.applicationId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5">
                    <div className="font-semibold text-[#172554]">{a.name}</div>
                    <div className="text-[10px] text-[#64748B]">{a.email}</div>
                  </td>
                  <td className="p-2.5 font-mono text-[11px] font-bold text-[#163A5F]">
                    {a.rollNumber}
                  </td>
                  <td className="p-2.5 text-[#64748B]">
                    {a.company || 'Drive'} • {a.role || 'Position'}
                  </td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        a.status === 'Selected'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : a.status === 'Shortlisted'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenStudent(a.studentId)}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#163A5F] hover:bg-[#2563EB] text-white transition-colors"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. STATISTICS
  if (responseType === 'STATISTICS') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {data.totalApplications !== undefined && (
          <div className="p-3 rounded-xl border border-[#DBEAFE] bg-white text-center">
            <div className="text-lg font-bold text-[#163A5F]">{data.totalApplications}</div>
            <div className="text-[10px] font-medium text-[#64748B]">Total Applications</div>
          </div>
        )}
        {data.selected !== undefined && (
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
            <div className="text-lg font-bold text-emerald-700">{data.selected}</div>
            <div className="text-[10px] font-medium text-emerald-800">Candidates Selected</div>
          </div>
        )}
        {data.shortlisted !== undefined && (
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-center">
            <div className="text-lg font-bold text-blue-700">{data.shortlisted}</div>
            <div className="text-[10px] font-medium text-blue-800">Shortlisted</div>
          </div>
        )}
        {data.reviewPending !== undefined && (
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-center">
            <div className="text-lg font-bold text-amber-700">{data.reviewPending}</div>
            <div className="text-[10px] font-medium text-amber-800">Pending Review</div>
          </div>
        )}
        {data.placementPercentage !== undefined && (
          <div className="p-3 rounded-xl border border-[#DBEAFE] bg-white text-center col-span-2">
            <div className="text-lg font-bold text-[#2563EB]">{data.placementPercentage}</div>
            <div className="text-[10px] font-medium text-[#64748B]">Overall Placement Rate</div>
          </div>
        )}
        {data.highestPackageLPA !== undefined && (
          <div className="p-3 rounded-xl border border-[#DBEAFE] bg-white text-center col-span-2">
            <div className="text-lg font-bold text-[#172554]">₹{data.highestPackageLPA} LPA</div>
            <div className="text-[10px] font-medium text-[#64748B]">Highest Compensation</div>
          </div>
        )}
      </div>
    );
  }

  // 5. REPORT SUMMARY
  if (responseType === 'REPORT') {
    const metrics = data.summaryMetrics || {};
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-[#DBEAFE] bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#DBEAFE] pb-2">
            <span className="font-bold text-xs text-[#172554]">Executive Placement Snapshot</span>
            <span className="text-[10px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded font-mono">
              {data.period}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[#EFF6FF]">
              <div className="font-bold text-sm text-[#163A5F]">{metrics.totalActiveDrives}</div>
              <div className="text-[10px] text-[#64748B]">Active Drives</div>
            </div>
            <div className="p-2 rounded-lg bg-[#EFF6FF]">
              <div className="font-bold text-sm text-[#163A5F]">{metrics.placedStudentsCount}</div>
              <div className="text-[10px] text-[#64748B]">Placed Students</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <div className="font-bold text-sm text-emerald-700">{metrics.overallPlacementRate}</div>
              <div className="text-[10px] text-emerald-800">Placement %</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50">
              <div className="font-bold text-sm text-emerald-700">₹{metrics.averagePackageLPA} LPA</div>
              <div className="text-[10px] text-emerald-800">Avg Package</div>
            </div>
          </div>
        </div>

        {Array.isArray(data.departmentHighlights) && (
          <div className="overflow-x-auto rounded-xl border border-[#DBEAFE] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DBEAFE]">
                <tr>
                  <th className="p-2 font-bold text-[#163A5F]">Department</th>
                  <th className="p-2 font-bold text-center">Total</th>
                  <th className="p-2 font-bold text-center">Placed</th>
                  <th className="p-2 font-bold text-center">% Placed</th>
                  <th className="p-2 font-bold text-center">Avg CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE]">
                {data.departmentHighlights.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 font-semibold text-[#172554]">{dept.department}</td>
                    <td className="p-2 text-center text-[#64748B]">{dept.total}</td>
                    <td className="p-2 text-center font-bold text-emerald-700">{dept.placed}</td>
                    <td className="p-2 text-center text-[#2563EB] font-bold">{dept.percentage}</td>
                    <td className="p-2 text-center text-[#64748B]">{dept.avgCgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // 6. RECOMMENDATIONS & STUDENT PREP
  if (responseType === 'RECOMMENDATIONS') {
    return (
      <div className="space-y-3">
        {data.averageResumeQualityScore && (
          <div className="p-3 rounded-xl border border-[#DBEAFE] bg-white flex items-center justify-between">
            <span className="text-xs font-semibold text-[#172554]">
              Campus Average Resume Quality
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
              {data.averageResumeQualityScore} / 100
            </span>
          </div>
        )}

        {Array.isArray(data.identifiedSkillGaps) && data.identifiedSkillGaps.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              High Priority Skill Gaps (High Drive Demand vs Low Student Supply)
            </h5>
            <div className="space-y-1.5">
              {data.identifiedSkillGaps.map((gap, i) => (
                <div key={i} className="text-xs bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                  <span className="font-bold text-[#172554]">{gap.skill}</span>
                  <span className="text-[10px] text-[#64748B]">{gap.recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(data.actionableRecommendations) && (
          <div className="space-y-2">
            {data.actionableRecommendations.map((rec, i) => (
              <div key={i} className="p-3 rounded-xl border border-[#DBEAFE] bg-white text-xs flex items-start gap-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rec.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {rec.priority}
                </span>
                <div>
                  <span className="font-bold text-[#172554]">{rec.area}: </span>
                  <span className="text-[#64748B]">{rec.action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 7. CONFIRMATION REQUIRED (Administrative Action Staging)
  if (responseType === 'CONFIRMATION_REQUIRED') {
    return (
      <div className="p-4 rounded-xl border-2 border-[#2563EB]/40 bg-[#EFF6FF]/40 space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#163A5F]">
          <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
          Administrative Action Staged: Confirmation Required
        </div>

        {/* Announcement Draft Review */}
        {data.actionType === 'PUBLISH_ANNOUNCEMENT' && (
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-[#DBEAFE]">
            <div className="text-xs font-bold text-[#172554]">
              {data.announcementTitle}
            </div>
            <div className="text-xs text-[#64748B] whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-sans">
              {data.message}
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-1">
              <span>Audience: <b>{data.targetAudience}</b></span>
              <span>Target Students: <b>~{data.targetCount}</b></span>
            </div>
          </div>
        )}

        {/* Shortlist Draft Review */}
        {data.actionType === 'UPDATE_APPLICATION_STATUS_BATCH' && (
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-[#DBEAFE]">
            <div className="text-xs font-bold text-[#172554]">
              Proposed Shortlist for {data.driveTitle} ({data.company})
            </div>
            <div className="text-xs text-[#64748B]">
              Found <b>{data.proposedCount}</b> candidate(s) meeting minimum CGPA cutoff of <b>{data.minCgpaCutoff}</b>.
            </div>
            {Array.isArray(data.proposedCandidates) && (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {data.proposedCandidates.map((c) => (
                  <div key={c.applicationId} className="text-xs p-1.5 bg-slate-50 rounded flex items-center justify-between">
                    <span className="font-semibold text-[#172554]">{c.name} ({c.rollNumber})</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                      CGPA {c.cgpa} → {data.targetStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={executingAction}
            onClick={() => {
              if (data.actionType === 'PUBLISH_ANNOUNCEMENT') {
                onExecuteAction(data.actionType, {
                  driveId: data.driveId,
                  announcementTitle: data.announcementTitle,
                  message: data.message,
                  targetAudience: data.targetAudience,
                });
              } else if (data.actionType === 'UPDATE_APPLICATION_STATUS_BATCH') {
                onExecuteAction(data.actionType, {
                  applicationIds: (data.proposedCandidates || []).map((c) => c.applicationId),
                  targetStatus: data.targetStatus,
                });
              }
            }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-xs"
          >
            Confirm & Execute Action
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default OfficerCopilot;
