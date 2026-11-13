import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Building2,
  Users,
  CheckCircle,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { isOfficer, isStudent } = useAuth();

  const studentLinks = [
    { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Placement Drives', to: '/student/drives', icon: Briefcase },
    { label: 'My Applications', to: '/student/applications', icon: FileText },
    { label: 'Student Profile', to: '/student/profile', icon: User },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ];

  const officerLinks = [
    { label: 'Overview & Stats', to: '/officer/dashboard', icon: LayoutDashboard },
    { label: 'Placement Drives', to: '/officer/drives', icon: Briefcase },
    { label: 'Companies', to: '/officer/companies', icon: Building2 },
    { label: 'Student Database', to: '/officer/students', icon: Users },
    { label: 'Applications & Results', to: '/officer/applications', icon: CheckCircle },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ];

  const links = isOfficer ? officerLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-20' : 'w-64'}`}
      >
        {/* Navigation list */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden mb-4 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isCollapsed ? 'justify-center lg:px-2' : ''
                    } ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                    {link.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Desktop Collapse Toggle & Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
            <p className="text-[11px] font-semibold text-slate-700 truncate">
              {isOfficer ? 'Placement Head' : 'Student Portal'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">Academic Year 2025–26</p>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden lg:flex p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
