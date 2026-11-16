import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  Menu,
  Bell,
  Briefcase,
  Check,
  Award,
  UserCheck,
  XCircle,
  FileText,
  ArrowRight,
  KeyRound,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import Badge from './Badge';
import ProfilePictureModal from './ProfilePictureModal';
import { getImageUrl } from '../../utils/imageUrl';

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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
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
    const wasOfficer = isOfficer;
    await logout();
    navigate(wasOfficer ? '/officer/login' : '/student/login');
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'DRIVE_PUBLISHED':
        return <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'APPLICATION_SELECTED':
        return <Award className="w-3.5 h-3.5 text-[#0D9488]" />;
      case 'APPLICATION_SHORTLISTED':
        return <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'APPLICATION_REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />;
      case 'APPLICATION_SUBMITTED':
        return <FileText className="w-3.5 h-3.5 text-[#163A5F]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#2563EB]" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#DBEAFE]">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button + Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-[#163A5F] hover:text-[#2563EB] hover:bg-[#F0F7FF] focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#163A5F] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#172554] text-base tracking-tight leading-none block">
                MITS Placements
              </span>
              <span className="text-[10px] text-[#64748B] font-medium tracking-wide uppercase">
                {isOfficer ? 'Officer Portal' : isStudent ? 'Student Portal' : 'Portal'}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: Notification Bell & User Profile */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={handleOpenNotifs}
                className="relative p-2 rounded-xl text-[#163A5F] hover:text-[#2563EB] hover:bg-[#F0F7FF] transition-colors focus:outline-none"
                title="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#2563EB] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#DBEAFE] z-30 overflow-hidden text-[#172554]">
                    {/* Popover Header */}
                    <div className="px-4 py-3 bg-[#F0F7FF] border-b border-[#DBEAFE] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#2563EB]" />
                        <h3 className="text-xs font-bold text-[#172554]">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-[#DBEAFE] text-[#163A5F] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#2563EB] hover:text-[#163A5F] hover:underline font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Popover Body */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#DBEAFE]/60">
                      {loadingNotifs ? (
                        <div className="py-8 text-center text-xs text-[#64748B]">
                          Loading alerts...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center text-xs text-[#64748B]">
                          <Bell className="w-6 h-6 mx-auto text-[#64748B] mb-1.5 opacity-60" />
                          <p className="font-semibold text-[#172554]">No notifications yet</p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            You'll receive alerts for drives and application updates here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 hover:bg-[#F0F7FF] transition-colors cursor-pointer flex items-start gap-3 relative ${
                              !item.isRead ? 'bg-[#EFF6FF]/60' : ''
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-[#EFF6FF] flex-shrink-0 mt-0.5 border border-[#DBEAFE]">
                              {getNotifIcon(item.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-[#172554] truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-[#64748B] flex-shrink-0">
                                  {formatRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-snug">
                                {item.message}
                              </p>
                            </div>

                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div className="p-2.5 bg-[#F0F7FF] border-t border-[#DBEAFE] text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#2563EB] font-bold hover:text-[#163A5F] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View All Notifications</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar & Account Menu */}
            <div className="relative flex items-center bg-[#F0F7FF] border border-[#DBEAFE] rounded-full p-1 pl-1 pr-2.5 shadow-sm">
              {/* Profile Icon - Clicking directly opens the full profile picture popup modal */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] hover:ring-2 hover:ring-[#172554] transition-all focus:outline-none overflow-hidden cursor-pointer flex-shrink-0"
                title="Click to view full profile picture"
              >
                {user.profilePhoto ? (
                  <img
                    src={getImageUrl(user.profilePhoto)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#163A5F]">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {/* Account Dropdown Toggle */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 ml-1.5 text-[#172554] hover:text-[#2563EB] text-xs font-semibold focus:outline-none"
                title="Account menu"
              >
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user.name?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#DBEAFE] py-1.5 z-20 text-sm">
                    {/* User Info Header (Clean & Minimal) */}
                    <div className="px-4 py-3 border-b border-[#DBEAFE]/80 flex items-center gap-3">
                      <div
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowPhotoModal(true);
                        }}
                        className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#163A5F] overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[#172554] transition-all"
                        title="Click to view full profile picture"
                      >
                        {user.profilePhoto ? (
                          <img
                            src={getImageUrl(user.profilePhoto)}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#163A5F]">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#172554] truncate text-xs sm:text-sm">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                        <span className="text-[10px] text-[#0D9488] font-semibold uppercase tracking-wider block mt-0.5">
                          {isOfficer ? 'Placement Officer' : 'Student'}
                        </span>
                      </div>
                    </div>

                    {isStudent && (
                      <Link
                        to="/student/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#172554] hover:bg-[#F0F7FF] text-xs sm:text-sm"
                      >
                        <UserIcon className="w-4 h-4 text-[#172554]" />
                        My Profile
                      </Link>
                    )}

                    {isOfficer && (
                      <Link
                        to="/officer/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#172554] hover:bg-[#F0F7FF] text-xs sm:text-sm"
                      >
                        <UserIcon className="w-4 h-4 text-[#172554]" />
                        Officer Profile
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#F0F7FF] border-t border-[#DBEAFE]/80 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            <ProfilePictureModal
              isOpen={showPhotoModal}
              onClose={() => setShowPhotoModal(false)}
              user={user}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/student/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#163A5F] hover:text-[#172554]"
            >
              Sign In
            </Link>
            <Link
              to="/student/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#172554] rounded-lg hover:bg-[#0f172a] shadow-sm"
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
