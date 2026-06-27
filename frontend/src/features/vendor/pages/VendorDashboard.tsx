import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Card } from '../../../components/Card/Card';
import { Loader } from '../../../components/Loader/Loader';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router';

const VendorDashboardComponent: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['vendorDashboard'],
    queryFn: vendorApi.getDashboard,
  });

  const { data: completionData } = useQuery({
    queryKey: ['vendorProfileCompletion'],
    queryFn: vendorApi.getProfileCompletion,
  });

  const formattedLogs = useMemo(() => {
    if (!dashboard?.recentActivities) return [];
    return dashboard.recentActivities.map((log) => ({
      ...log,
      formattedDate: new Date(log.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }, [dashboard?.recentActivities]);

  if (isLoading) return <Loader />;

  const status = dashboard?.profile?.status || 'PENDING';
  const profileCompletion = dashboard?.profile?.profileCompletion || 0;
  const servicesCount = dashboard?.serviceCount || 0;

  const statusConfigs = {
    APPROVED: {
      color: 'bg-green-50 border-green-100 text-green-800',
      icon: <CheckCircle2 className="h-5 w-5 text-green-700" />,
      title: 'Profile Approved',
      description: 'Your vendor registration is fully verified. You can bid on construction projects.',
    },
    PENDING: {
      color: 'bg-amber-50 border-amber-100 text-amber-800',
      icon: <Clock className="h-5 w-5 text-amber-700" />,
      title: 'Review in Progress',
      description: 'Your profile has been submitted and is currently undergoing administrative review.',
    },
    REJECTED: {
      color: 'bg-red-50 border-red-100 text-red-800',
      icon: <XCircle className="h-5 w-5 text-red-700" />,
      title: 'Registration Rejected',
      description: 'Your submission did not meet our guidelines. Please review the missing criteria.',
    },
  };

  const activeStatus = statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.PENDING;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Overview of your contractor profile, verification status, and trades
        </p>
      </div>

      {/* Onboarding Status Alert */}
      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center ${activeStatus.color}`}>
        <div className="p-2 bg-white rounded-lg shadow-xs">{activeStatus.icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-bold tracking-tight">{activeStatus.title}</h3>
          <p className="text-xs mt-0.5 text-slate-600 leading-relaxed">{activeStatus.description}</p>
        </div>
        {status === 'REJECTED' && (
          <Link
            to="/vendor/profile-completion"
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-lg transition-colors select-none"
          >
            Update Profile
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Card */}
        <Card title="Profile Completion" subtitle="Account data required for full registration">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-slate-800">{profileCompletion}%</span>
              <span className="text-xs font-semibold text-slate-400">Target 100%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            {completionData && completionData.missingFields && completionData.missingFields.length > 0 ? (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Action Required: Missing Info
                </span>
                <ul className="text-xs text-slate-500 list-disc pl-4 flex flex-col gap-1">
                  {completionData.missingFields.slice(0, 3).map((field: string) => (
                    <li key={field} className="capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </li>
                  ))}
                  {completionData.missingFields.length > 3 && (
                    <li className="italic text-xxs font-medium text-slate-400">
                      +{completionData.missingFields.length - 3} more fields
                    </li>
                  )}
                </ul>
                <Link
                  to="/vendor/profile-completion"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover mt-2"
                >
                  Fill Profile Data <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700 text-xs font-semibold bg-green-50 border border-green-100/50 p-2.5 rounded-lg mt-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> Profile onboarding complete!
              </div>
            )}
          </div>
        </Card>

        {/* Registered Services Card */}
        <Card title="Registered Services" subtitle="Trades and scopes of work registered">
          <div className="flex flex-col justify-between h-full gap-5">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 rounded-lg bg-primary-light flex items-center justify-center border border-emerald-100">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-800">{servicesCount}</span>
                <p className="text-xxs text-slate-400 font-semibold uppercase tracking-wider">Active Services</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                Add categories and scope selections to increase visibility for contracts.
              </p>
              <Link
                to="/vendor/services"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl transition-colors justify-center mt-3 shadow-xs select-none"
              >
                <PlusCircle className="h-4 w-4" /> Manage My Services
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Links Card */}
        <Card title="Quick Resources" subtitle="Need assistance or reference logs?">
          <div className="flex flex-col gap-3 py-1">
            <Link
              to="/profile"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 select-none"
            >
              <span>View Onboarding Profile</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/change-password"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 select-none"
            >
              <span>Update Security Password</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <a
              href="mailto:compliance@constructioncompany.com"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 select-none"
            >
              <span>Email Compliance Support</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </a>
          </div>
        </Card>
      </div>

      {/* Recent activity log */}
      <Card title="Recent Activity Trail" subtitle="Timeline logs of actions taken by this account">
        {formattedLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">No recent actions recorded.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100/50">
            {formattedLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-800">{log.action}</span>
                  <span className="text-xxs text-slate-400">{log.details}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xxs font-medium whitespace-nowrap shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                  {log.formattedDate}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export const VendorDashboard = React.memo(VendorDashboardComponent);
VendorDashboard.displayName = 'VendorDashboard';
export default VendorDashboard;
