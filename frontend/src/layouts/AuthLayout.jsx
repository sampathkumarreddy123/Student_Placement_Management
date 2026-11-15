import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Home,
  Building2,
  Briefcase,
  CheckCircle2,
  Award,
  ShieldCheck,
  Mail,
} from 'lucide-react';

const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');
  const isLogin = location.pathname.includes('login') || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#EFF6FF] flex flex-col font-sans">
      {/* 1. TOP INSTITUTIONAL HEADER */}
      <header className="bg-white border-b border-[#DBEAFE] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand & Institutional Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#163A5F] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E4976] transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-[#172554] text-base sm:text-lg leading-tight tracking-tight">
                MITS Placements
              </span>
              <span className="text-[11px] text-[#64748B] font-medium leading-tight hidden sm:block">
                Madanapalle Institute of Technology & Science • Training & Placement Cell
              </span>
              <span className="text-[10px] text-[#64748B] font-medium leading-tight sm:hidden">
                Training & Placement Cell
              </span>
            </div>
          </Link>

          {/* Right: Quick Navigation Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/landing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#163A5F] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Portal Home</span>
            </Link>

            <a
              href="mailto:placement@mits.ac.in"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#172554] transition-colors px-2 py-1"
              title="Placement Cell Helpdesk"
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>placement@mits.ac.in</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {isLogin ? (
          /* Desktop Split Showcase for Login Pages */
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Professional Institutional Showcase Panel (Visible on lg+) */}
            <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 pr-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] border border-[#DBEAFE] text-[#163A5F] text-xs font-semibold w-fit">
                <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Campus Recruitment Portal • 2025–26</span>
              </div>

              {/* Headline & Description */}
              <div className="space-y-3">
                <h1 className="text-3xl xl:text-4xl font-extrabold text-[#172554] tracking-tight leading-tight">
                  Empowering Careers, Connecting Talent with Opportunity
                </h1>
                <p className="text-sm text-[#64748B] leading-relaxed max-w-xl">
                  Welcome to the official recruitment gateway of Madanapalle Institute of Technology & Science. Track verified campus drives, assess eligibility metrics, and navigate selection rounds with complete transparency.
                </p>
              </div>

              {/* 3 Value Proposition Cards */}
              <div className="grid grid-cols-1 gap-3.5 pt-2 max-w-xl">
                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-[#DBEAFE] shadow-xs">
                  <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">500+ Partner Companies</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal mt-0.5">
                      Direct campus hiring drives from leading multinational technology leaders, consulting corporations, and emerging core sectors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-[#DBEAFE] shadow-xs">
                  <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">Automated Eligibility Matching</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal mt-0.5">
                      Instant verification against CGPA cutoffs, department criteria, and backlogs ensures transparent student eligibility.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-[#DBEAFE] shadow-xs">
                  <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex-shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172554]">Multi-Round Selection Pipeline</h4>
                    <p className="text-[11px] text-[#64748B] leading-normal mt-0.5">
                      Real-time progression tracking through Online Assessments, Technical Interviews, and Final HR Selection rounds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Accreditation pill */}
              <div className="pt-2 text-[11px] text-[#64748B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                <span>UGC - Autonomous Institution • NAAC 'A+' Grade • Approved by AICTE</span>
              </div>
            </div>

            {/* Right: Authentication Form Card */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto">
              <div className="bg-white p-6 sm:p-8 shadow-sm border border-[#DBEAFE] rounded-2xl">
                <Outlet />
              </div>
            </div>
          </div>
        ) : (
          /* Centered Layout for Registration & Password Management */
          <div className={`w-full ${isRegister ? 'max-w-xl' : 'max-w-md'} mx-auto`}>
            <div className="bg-white p-6 sm:p-8 shadow-sm border border-[#DBEAFE] rounded-2xl">
              <Outlet />
            </div>
          </div>
        )}
      </main>

      {/* 3. INSTITUTIONAL FOOTER */}
      <footer className="bg-white border-t border-[#DBEAFE] py-4 px-4 sm:px-8 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© 2026 Madanapalle Institute of Technology & Science • Training & Placement Cell</p>
          <p className="text-[11px] text-[#64748B]">
            Post Box No. 14, Kadiri Road, Angallu, Madanapalle - 517325, Andhra Pradesh
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
