import React from 'react';
import { Outlet, Navigate } from 'react-router';
import { useAuth } from '../../features/auth/context/AuthContext';

const AuthLayoutComponent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Column: Brand Info Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-primary-hover to-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden select-none">
        {/* Abstract background graphics (subtle blur gradients) */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-white font-black text-base">C</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white/95">
            Construction VMS
          </span>
        </div>

        {/* Company Info / Value Proposition */}
        <div className="my-auto max-w-md relative z-10 flex flex-col gap-5">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Real Estate Solutions</span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Scale Your Construction Contractor Network.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            Empower your developers, streamline compliance licensing workflows, and manage trades across multi-division projects in one single place.
          </p>

          {/* Micro Stats List */}
          <div className="grid grid-cols-2 gap-6 mt-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-3xl font-black text-white">99.8%</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Audit Compliance</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">2.5k+</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Active Subcontractors</p>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="text-xs text-slate-500 relative z-10 font-semibold">
          &copy; {new Date().getFullYear()} Real Estate Construction VMS. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 md:p-10 bg-slate-50/50 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white border border-slate-100/85 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5 relative">
          {/* Logo on mobile view only */}
          <div className="flex flex-col items-center text-center gap-1.5 md:hidden mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-base">C</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight mt-2.5">
              Construction VMS
            </h2>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Vendor Management & Compliance
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const AuthLayout = React.memo(AuthLayoutComponent);
AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;
