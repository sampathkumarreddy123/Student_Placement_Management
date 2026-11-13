import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Check,
  Trash2,
  ExternalLink,
  Briefcase,
  FileText,
  Award,
  UserCheck,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Filter,
  ArrowRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  if (diffInSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationsPage = () => {
  const toast = useToast();
  const { isOfficer, isStudent } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, drives, applications
  const [actionAlert, setActionAlert] = useState(null);

  const fetchNotifications = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const params = { limit: 50 };
      if (activeTab === 'unread') params.unreadOnly = 'true';
      if (activeTab === 'drives') params.type = 'DRIVE_PUBLISHED';
      if (activeTab === 'applications') {
        // Fetch all application related types
      }

      const res = await notificationService.getNotifications(params);
      let list = res.notifications || [];

      if (activeTab === 'applications') {
        list = list.filter((n) => n.type.startsWith('APPLICATION_'));
      }

      setNotifications(list);
      setUnreadCount(res.unreadCount || 0);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setActionAlert({ type: 'error', text: 'Could not load notifications.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
      setActionAlert({ type: 'success', text: 'All notifications marked as read.' });
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error('Failed to mark all notifications as read.');
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('Read notifications cleared.');
      setActionAlert({ type: 'success', text: 'Read notifications cleared.' });
    } catch (err) {
      console.error('Failed to clear read notifications', err);
      toast.error('Failed to clear read notifications.');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Notification removed.');
    } catch (err) {
      console.error('Failed to delete notification', err);
      toast.error('Failed to remove notification.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DRIVE_PUBLISHED':
        return { icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'APPLICATION_SELECTED':
        return { icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'APPLICATION_SHORTLISTED':
        return { icon: UserCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'APPLICATION_REJECTED':
        return { icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'APPLICATION_SUBMITTED':
        return { icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      default:
        return { icon: Bell, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Page Header */}
      <PageHeader
        category="Activity Stream"
        title="Recruitment Notifications & Alerts"
        subtitle="Instant alerts regarding campus drives, application progression, and evaluation rounds"
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={refreshing}
              onClick={() => fetchNotifications(true)}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" icon={Check} onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" icon={Trash2} onClick={handleClearRead}>
              Clear Read
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Notifications</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'drives'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Placement Drives</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Applications</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Retrieving verified notifications..." />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications found"
          description={
            activeTab === 'unread'
              ? 'You have caught up with all your notifications! Check back later for new updates.'
              : 'When placement drives are announced or application evaluations are updated, notifications will arrive here.'
          }
          actionLabel="Back to Dashboard"
          actionLink={isOfficer ? '/officer/dashboard' : '/student/dashboard'}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const { icon: Icon, color: iconStyle } = getNotificationIcon(item.type);
            return (
              <div
                key={item._id}
                onClick={() => handleMarkAsRead(item._id, item.link)}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all cursor-pointer hover:shadow-md relative group ${
                  item.isRead
                    ? 'border-slate-200/90 hover:border-slate-300'
                    : 'border-blue-300 bg-blue-50/20 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${iconStyle}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {item.link && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
                            <span>Open details</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, item._id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

