import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Bell,
  Briefcase,
  Building,
  Users,
  Check,
  Award,
  UserCheck,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import Badge from './Badge';

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

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isOfficer, isStudent } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch unread count & recent notifications
  const fetchNotifData = async () => {
    if (!user) return;
    try {
      const [countRes, listRes] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications({ limit: 6 }),
      ]);
      setUnreadCount(countRes.unreadCount || 0);
      setNotifications(listRes.notifications || []);
    } catch (err) {
      console.error('Navbar notification poll error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifData();
      const interval = setInterval(fetchNotifData, 30000); // 30s live poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleOpenNotifs = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && user) {
      setLoadingNotifs(true);
      try {
        const res = await notificationService.getNotifications({ limit: 8 });
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifOpen(false);
      if (notif.link) {
        navigate(notif.link);
      } else {
        navigate(isOfficer ? '/officer/dashboard' : '/student/dashboard');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'DRIVE_PUBLISHED':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      case 'APPLICATION_SELECTED':
        return <Award className="w-3.5 h-3.5 text-emerald-600" />;
      case 'APPLICATION_SHORTLISTED':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'APPLICATION_REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'APPLICATION_SUBMITTED':
        return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button + Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                CampusPlacement
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                {isOfficer ? 'Officer Portal' : isStudent ? 'Student Portal' : 'Portal'}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: Notification Bell & User Profile */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User role pill (desktop) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium truncate max-w-[120px]">{user.name}</span>
              <Badge variant={isOfficer ? 'purple' : 'primary'} size="sm">
                {user.role}
              </Badge>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={handleOpenNotifs}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                title="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute 1.5 -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 overflow-hidden text-slate-800">
                    {/* Popover Header */}
                    <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-1.5 py-0.2 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Popover Body */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {loadingNotifs ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Loading alerts...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center text-xs text-slate-400">
                          <Bell className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                          <p className="font-semibold text-slate-700">No notifications yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            You'll receive alerts for drives and application updates here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative ${
                              !item.isRead ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5 border border-slate-200">
                              {getNotifIcon(item.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                  {formatRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                                {item.message}
                              </p>
                            </div>

                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>View All Notifications</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <UserIcon className="w-4 h-4" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-sm">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    {isStudent && (
                      <Link
                        to="/student/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                    )}

                    <Link
                      to="/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span>Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
