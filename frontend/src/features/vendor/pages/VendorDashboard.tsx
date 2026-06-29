import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router';

const VendorDashboardComponent: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['vendorDashboard'],
    queryFn: vendorApi.getDashboard,
  });

  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['vendorDocuments'],
    queryFn: vendorApi.getDocuments,
  });

  const { data: fullProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
  });

  const submitMutation = useMutation({
    mutationFn: vendorApi.submitProfile,
    onSuccess: () => {
      toastService.success('Profile submitted for compliance review successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProfileCompletion'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to submit profile';
      logger.error('Failed to submit profile', error);
      toastService.error(errMsg);
    },
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

  if (isLoadingDashboard || isLoadingDocs || isLoadingProfile) return <Loader />;

  const status = dashboard?.profile?.status || 'PENDING';
  const isSubmitted = dashboard?.profile?.isSubmitted || false;
  const servicesCount = dashboard?.serviceCount || 0;

  // Onboarding Checklist Stage Checks
  const isDetailsComplete = !!(
    fullProfile?.ownerName &&
    fullProfile?.phone &&
    fullProfile?.address &&
    fullProfile?.region &&
    fullProfile?.city &&
    fullProfile?.country
  );

  const isServicesComplete = servicesCount > 0;

  const requiredDocTypes = [
    'Trade License',
    'VAT Registration',
    'Saudization Certificate',
    'GOSI Certificate',
    'Chamber of Commerce',
    'Zakat Certificate',
  ];
  const uploadedDocTypes = documents.map((d) => d.name);
  const uploadedCount = requiredDocTypes.filter((type) => uploadedDocTypes.includes(type)).length;
  const isDocumentsComplete = uploadedCount === 6;

  const isAllComplete = isDetailsComplete && isServicesComplete && isDocumentsComplete;

  const statusConfigs = {
    APPROVED: {
      color: 'bg-green-50 border-green-100 text-green-800',
      icon: <CheckCircle2 className="h-5 w-5 text-green-700" />,
      title: 'Profile Approved',
      description: 'Your vendor registration is fully verified. You can participate in system processes.',
    },
    PENDING: isSubmitted
      ? {
          color: 'bg-amber-50 border-amber-100 text-amber-800',
          icon: <Clock className="h-5 w-5 text-amber-700" />,
          title: 'Review in Progress',
          description: 'Your profile has been submitted and is currently undergoing administrative review. All details are locked.',
        }
      : {
          color: 'bg-blue-50 border-blue-100 text-blue-800',
          icon: <AlertTriangle className="h-5 w-5 text-blue-700" />,
          title: 'Onboarding Draft Mode',
          description: 'Please complete all onboarding stages below and submit your profile for administrative review.',
        },
    REJECTED: {
      color: 'bg-red-50 border-red-100 text-red-800',
      icon: <XCircle className="h-5 w-5 text-red-700" />,
      title: 'Registration Rejected',
      description: 'Your submission did not meet our guidelines. Please review and correct the onboarding criteria below.',
    },
  };

  const activeStatus = statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.PENDING;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Vendor Dashboard
          {fullProfile?.vendorCode && (
            <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md select-none">
              {fullProfile.vendorCode}
            </span>
          )}
        </h1>
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
        {status === 'REJECTED' && !isSubmitted && (
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
        <Card title="Profile Onboarding Stages" subtitle="Mandatory registration stages">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {/* Stage 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  {isDetailsComplete ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0" />
                  ) : (
                    <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-700">1. Profile Details</span>
                </div>
                {!isSubmitted && (
                  <Link to="/vendor/profile-completion" className="text-xxs font-bold text-primary hover:underline shrink-0">
                    {isDetailsComplete ? 'Edit' : 'Complete'}
                  </Link>
                )}
              </div>

              {/* Stage 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  {isServicesComplete ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0" />
                  ) : (
                    <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-700">2. Trade Services</span>
                </div>
                {!isSubmitted && (
                  <Link to="/vendor/services" className="text-xxs font-bold text-primary hover:underline shrink-0">
                    {isServicesComplete ? 'Manage' : 'Add Trades'}
                  </Link>
                )}
              </div>

              {/* Stage 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  {isDocumentsComplete ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0" />
                  ) : (
                    <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-700">3. Compliance Docs ({uploadedCount}/6)</span>
                </div>
                {!isSubmitted && (
                  <Link to="/vendor/documents" className="text-xxs font-bold text-primary hover:underline shrink-0">
                    {isDocumentsComplete ? 'Manage' : 'Upload Docs'}
                  </Link>
                )}
              </div>
            </div>

            {isAllComplete && !isSubmitted ? (
              <Button
                onClick={() => submitMutation.mutate()}
                isLoading={submitMutation.isPending}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Submit Profile for Approval
              </Button>
            ) : isSubmitted && status === 'PENDING' ? (
              <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-100/50 p-2.5 rounded-xl mt-2 select-none">
                <Lock className="h-4 w-4 shrink-0" /> Profile Locked - Under Review
              </div>
            ) : status === 'APPROVED' ? (
              <div className="flex items-center justify-center gap-1.5 text-green-700 text-xs font-semibold bg-green-50 border border-green-100/50 p-2.5 rounded-xl mt-2 select-none">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> Onboarding Complete!
              </div>
            ) : (
              <div className="text-slate-400 text-xxs font-medium italic text-center mt-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                Complete all stages above to submit
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
