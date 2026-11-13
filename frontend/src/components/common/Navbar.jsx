import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Badge from './Badge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isOfficer, isStudent } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

        {/* Right Side: User Profile & Actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">{user.name}</span>
              <Badge variant={isOfficer ? 'purple' : 'primary'} size="sm">
                {user.role}
              </Badge>
            </div>

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

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50"
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

