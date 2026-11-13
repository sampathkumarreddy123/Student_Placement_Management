import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { user, isOfficer, isStudent } = useAuth();

  const dashboardPath = isOfficer
    ? '/officer/dashboard'
    : isStudent
    ? '/student/dashboard'
    : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              CampusPlacement
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardPath}>
                <Button variant="primary" size="sm" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/officer/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1">
                  Officer Portal
                </Link>
                <Link to="/student/login">
                  <Button variant="outline" size="sm">
                    Student Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mx-auto mb-6">
          <TrendingUp className="w-3.5 h-3.5" />
          Streamlined Campus Placement Workflow
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Empowering College Placements with{' '}
          <span className="text-blue-600">Precision & Transparency</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A dedicated portal connecting students and placement officers. Check live
          drive eligibility, manage corporate partners, track round-by-round selection
          results, and celebrate student career milestones.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <Link to={dashboardPath}>
              <Button size="lg" icon={ArrowRight}>
                Open Your Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" icon={ArrowRight}>
                  Create Student Account
                </Button>
              </Link>
              <Link to="/officer/login">
                <Button variant="outline" size="lg">
                  Placement Officer Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              Automated Eligibility Engine
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Instantly verifies CGPA, active backlog limits, graduation batch, and
              department eligibility before application submission.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              Placement Drive Tracking
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Explore open positions, packages (LPA), selection rounds, and deadlines
              with structured multi-stage status tracking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              Officer Administration
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Comprehensive control panel to schedule drives, partner with companies,
              shortlist candidates, and track overall placement rates.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 CampusPlacement Portal. Built for academic excellence.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

