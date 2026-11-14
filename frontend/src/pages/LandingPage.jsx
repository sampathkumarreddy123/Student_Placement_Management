import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { user, isOfficer, isStudent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardPath = isOfficer
    ? '/officer/dashboard'
    : isStudent
    ? '/student/dashboard'
    : '/student/login';

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#44352D] flex flex-col font-sans">
      {/* 1. Minimal Navigation Bar */}
      <header className="bg-white border-b border-[#E8DED2] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo & Branding */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#44352D] flex items-center justify-center text-[#F1E7D9] shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#44352D] text-base leading-tight tracking-tight">
                CampusPlacement
              </span>
              <span className="text-[11px] text-[#82776C] font-semibold leading-tight">
                Recruitment Portal
              </span>
            </div>
          </Link>

          {/* Right: Desktop Links */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link to={dashboardPath}>
                <Button variant="primary" size="sm" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/student/login"
                  className="text-xs font-semibold text-[#44352D] hover:text-[#76543D] transition-colors px-3 py-1.5 rounded-md hover:bg-[#F6F0E8]"
                >
                  Student Login
                </Link>
                <Link to="/student/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
                <span className="h-4 w-px bg-[#E8DED2]" />
                <Link
                  to="/officer/login"
                  className="text-xs font-semibold text-[#82776C] hover:text-[#44352D] transition-colors px-2 py-1"
                >
                  Officer Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#82776C] hover:text-[#44352D] hover:bg-[#F6F0E8] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-[#E8DED2] px-4 pt-2 pb-4 space-y-2">
            {user ? (
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full"
              >
                <Button variant="primary" size="sm" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/student/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#44352D] hover:text-[#76543D] py-2 px-3 rounded-lg hover:bg-[#F6F0E8]"
                >
                  Student Login
                </Link>
                <Link
                  to="/student/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#44352D] py-2 px-3 rounded-lg hover:bg-[#F6F0E8]"
                >
                  Register
                </Link>
                <Link
                  to="/officer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#82776C] hover:text-[#44352D] py-2 px-3 rounded-lg hover:bg-[#F6F0E8]"
                >
                  Officer Login
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
        {/* 2. Hero Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          {/* Small Label */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F1E7D9] border border-[#E8DED2] text-[#44352D] text-xs font-semibold mb-5 shadow-sm">
            Campus Recruitment Portal
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#44352D] tracking-tight leading-tight">
            Your Career Starts Here.
          </h1>

          {/* Description */}
          <p className="mt-4 text-sm sm:text-base text-[#82776C] max-w-xl mx-auto leading-relaxed">
            Explore placement opportunities, check your eligibility and track your applications in one place.
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link to={dashboardPath}>
                <Button size="md" icon={ArrowRight}>
                  Open Your Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/student/login" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" className="w-full sm:w-auto px-6">
                    Student Login
                  </Button>
                </Link>
                <Link to="/student/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="md" className="w-full sm:w-auto px-6">
                    Create Student Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Text link below buttons */}
          {!user && (
            <p className="mt-5 text-xs text-[#82776C]">
              Are you a Placement Officer?{' '}
              <Link
                to="/officer/login"
                className="font-semibold text-[#76543D] hover:text-[#44352D] hover:underline"
              >
                Sign in here.
              </Link>
            </p>
          )}
        </section>

        {/* 3. Features Section (Exactly 3 clean cards) */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DED2] shadow-sm flex flex-col hover:border-[#A17C5B]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#F1E7D9] text-[#76543D] border border-[#E8DED2] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#44352D] text-sm sm:text-base">
                Smart Eligibility Checking
              </h3>
              <p className="mt-2 text-xs text-[#82776C] leading-relaxed">
                Automatically verify academic eligibility for placement drives.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DED2] shadow-sm flex flex-col hover:border-[#A17C5B]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#F1E7D9] text-[#76543D] border border-[#E8DED2] flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#44352D] text-sm sm:text-base">
                Placement Opportunities
              </h3>
              <p className="mt-2 text-xs text-[#82776C] leading-relaxed">
                Explore companies, job roles, packages and recruitment deadlines.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DED2] shadow-sm flex flex-col hover:border-[#A17C5B]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#F1E7D9] text-[#76543D] border border-[#E8DED2] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#44352D] text-sm sm:text-base">
                Application Tracking
              </h3>
              <p className="mt-2 text-xs text-[#82776C] leading-relaxed">
                Monitor application progress and selection results.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8DED2] py-5 text-center text-xs text-[#82776C]">
        <p>© 2026 CampusPlacement. College Placement Management Portal.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
