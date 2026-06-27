import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Card } from '../../../components/Card/Card';
import { Loader } from '../../../components/Loader/Loader';
import {
  Building,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router';

const AdminDashboardComponent: React.FC = () => {
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminApi.getDashboard,
  });

  const { data: recentVendorsData, isLoading: isLoadingVendors } = useQuery({
    queryKey: ['adminDashboardRecentVendors'],
    queryFn: () => adminApi.listVendors({ page: 1, limit: 5 }),
  });

  const { data: latestActivityData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['adminDashboardLatestActivity'],
    queryFn: () => adminApi.listActivityLogs({ page: 1, limit: 5 }),
  });

  const stats = useMemo(() => {
    if (!statsData) {
      return {
        totalVendors: 0,
        approvedVendors: 0,
        pendingVendors: 0,
        rejectedVendors: 0,
        totalServices: 0,
      };
    }
    return statsData;
  }, [statsData]);

  const recentVendors = useMemo(() => {
    return recentVendorsData?.data || [];
  }, [recentVendorsData]);

  const latestActivity = useMemo(() => {
    return latestActivityData?.data || [];
  }, [latestActivityData]);

  const isLoading = isLoadingStats || isLoadingVendors || isLoadingLogs;

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Admin Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          General overview of contractor applications, service lists, and logs
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total */}
        <Card title="Total Vendors" className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-850">{stats.totalVendors}</span>
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building className="h-4.5 w-4.5 text-slate-600" />
            </div>
          </div>
        </Card>

        {/* Pending */}
        <Card title="Pending" className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-amber-800">{stats.pendingVendors}</span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-amber-700" />
            </div>
          </div>
        </Card>

        {/* Approved */}
        <Card title="Approved" className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-green-800">{stats.approvedVendors}</span>
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5 text-green-700" />
            </div>
          </div>
        </Card>

        {/* Rejected */}
        <Card title="Rejected" className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-red-800">{stats.rejectedVendors}</span>
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-4.5 w-4.5 text-red-700" />
            </div>
          </div>
        </Card>

        {/* Total Services */}
        <Card title="Global Services" className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-primary">{stats.totalServices}</span>
            <div className="h-9 w-9 rounded-lg bg-primary-light flex items-center justify-center">
              <FileCheck className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Vendor Submissions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card
            title="Recent Vendor Onboardings"
            subtitle="Review pending or recent company profile listings"
            headerAction={
              <Link
                to="/admin/vendors"
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline inline-flex items-center gap-1"
              >
                Browse All <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-3 px-3">Vendor / Contact</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Completion</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                  {recentVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block">
                          {vendor.companyName || vendor.ownerName}
                        </span>
                        <span className="text-xxs text-slate-400 font-medium">{vendor.phone}</span>
                      </td>
                      <td className="py-3.5 px-3 uppercase text-xxs font-bold">{vendor.vendorType}</td>
                      <td className="py-3.5 px-3">{vendor.profileCompletion}%</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-bold ${
                            vendor.status === 'APPROVED'
                              ? 'bg-green-50 text-green-700 border border-green-100/50'
                              : vendor.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                              : 'bg-red-50 text-red-700 border border-red-100/50'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          to={`/admin/vendors/${vendor.id}`}
                          className="text-xs font-bold text-primary hover:text-primary-hover"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentVendors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        No recent vendors registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Audit Log Timeline */}
        <Card title="Latest Admin Activity Log" subtitle="Log audit of actions taken across the system">
          {latestActivity.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No logs recorded.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100/50 max-h-[400px] overflow-y-auto pr-1">
              {latestActivity.map((log) => (
                <div key={log.id} className="py-3 flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-700">{log.action}</span>
                  <span className="text-xxs text-slate-400 leading-normal">{log.details}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">
                    {new Date(log.createdAt).toLocaleDateString()} at{' '}
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export const AdminDashboard = React.memo(AdminDashboardComponent);
AdminDashboard.displayName = 'AdminDashboard';
export default AdminDashboard;
