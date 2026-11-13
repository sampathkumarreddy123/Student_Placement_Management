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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
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
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between lg:hidden mb-4">
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
          <p className="font-medium text-slate-500">Placement Management</p>
          <p>Academic Year 2025–2026</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

