import React from 'react';
import { Link } from 'react-router';
import { Building2, ListPlus, Users2, ArrowRight } from 'lucide-react';

const LandingComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="font-extrabold text-slate-800 tracking-tight text-sm">
              Construction VMS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-650 hover:text-slate-800 px-4 py-2 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs border border-primary-hover/10"
            >
              Register Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-white relative overflow-hidden flex items-center py-20 px-6">
        {/* Decorative Gradients */}
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
          <span className="text-xxs font-extrabold text-primary uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full">
            Enterprise CRM & Compliance Portal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-2xl">
            Scale and Audit Your Construction Subcontractor Network
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
            Streamline developer compliance checklists, evaluate vendor registration files, and manage cascading trade registers across multi-division projects in one single place.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full justify-center">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              Start Vendor Onboarding
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-bold text-xs px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign In to System
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full select-none">
        <div className="text-center mb-16 flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Built for Builders and Contractors</h2>
          <p className="text-slate-400 text-xs font-semibold">Four powerful modules aligned into one real estate system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-xs hover:shadow-sm transition-all flex flex-col gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-primary border border-emerald-100/50 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Compliance Auditing</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Validate trade licenses, tax registration number keys, and file metrics automatically through administrator compliance checklists.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-xs hover:shadow-sm transition-all flex flex-col gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-primary border border-emerald-100/50 flex items-center justify-center">
              <ListPlus className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Cascading Service Trees</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Map suppliers to specific trade codes using cascading dropdown selectors from Main Category down to local Subcategory scopes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-xs hover:shadow-sm transition-all flex flex-col gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-primary border border-emerald-100/50 flex items-center justify-center">
              <Users2 className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">Access Management</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Strict role-based routing controls isolating administrator CRM dashboards from subcontractor self-service trade logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 px-6 select-none mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xxs">C</span>
            </div>
            <span className="text-xs font-bold text-slate-700">Construction VMS</span>
          </div>
          <p className="text-xxs text-slate-400 font-semibold">
            &copy; {new Date().getFullYear()} Construction Vendor Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const Landing = React.memo(LandingComponent);
Landing.displayName = 'Landing';
export default Landing;
