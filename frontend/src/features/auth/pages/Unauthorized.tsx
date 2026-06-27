import React from 'react';
import { Link } from 'react-router';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedComponent: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 gap-5">
      <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
        <ShieldAlert className="h-9 w-9" />
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Access Denied
        </h1>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          You do not have the required permissions or administrator clearance to access this module page.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Return to Dashboard
      </Link>
    </div>
  );
};

export const Unauthorized = React.memo(UnauthorizedComponent);
Unauthorized.displayName = 'Unauthorized';
export default Unauthorized;
