import React, { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Card } from '../../../components/Card/Card';
import { Loader } from '../../../components/Loader/Loader';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { ArrowLeft, Check, X } from 'lucide-react';

const VendorDetailsComponent: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['adminVendorDetails', id],
    queryFn: () => adminApi.getVendorDetails(id),
    enabled: !!id,
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
      adminApi.updateVendorStatus(id, status),
    onSuccess: (data) => {
      toastService.success(`Vendor application status updated to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      setIsConfirmOpen(false);
      setConfirmAction(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update vendor status';
      logger.error('Failed to change status', error);
      toastService.error(errMsg);
    },
  });

  const handleApprove = useCallback(() => {
    setConfirmAction('APPROVED');
    setIsConfirmOpen(true);
  }, []);

  const handleReject = useCallback(() => {
    setConfirmAction('REJECTED');
    setIsConfirmOpen(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    if (confirmAction) {
      statusMutation.mutate({ status: confirmAction });
    }
  }, [confirmAction, statusMutation]);

  const handleConfirmClose = useCallback(() => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
  }, []);

  const services = useMemo(() => vendor?.services || [], [vendor?.services]);

  if (isLoading) return <Loader />;
  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Vendor profile not found.</p>
        <Link to="/admin/vendors" className="text-xs text-primary font-bold hover:underline mt-2 inline-block">
          Back to Database
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to="/admin/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 select-none"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Database
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {vendor.companyName || vendor.ownerName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered: {new Date(vendor.createdAt).toLocaleDateString()} | Compliance profile file
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
              vendor.status === 'APPROVED'
                ? 'bg-green-50 text-green-700 border-green-200'
                : vendor.status === 'PENDING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {vendor.status}
          </span>
        </div>
      </div>

      {/* Profile summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card title="Contractor Profile Details" subtitle="Onboarding credentials and license metadata">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-600">
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Vendor Type</span>
                <span className="font-bold text-slate-700">{vendor.vendorType}</span>
              </div>
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Primary Contact / Owner</span>
                <span>{vendor.ownerName}</span>
              </div>
              {vendor.vendorType === 'COMPANY' && (
                <>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Company Name</span>
                    <span>{vendor.companyName}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Trade License #</span>
                    <span className="font-mono text-slate-700 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {vendor.tradeLicenseNo}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Tax TRN #</span>
                    <span className="font-mono text-slate-700 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {vendor.taxRegistrationNo}
                    </span>
                  </div>
                </>
              )}
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Phone</span>
                <span>{vendor.phone}</span>
              </div>
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Website</span>
                {vendor.website ? (
                  <a href={vendor.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {vendor.website}
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Onboarding Address</span>
                <span>
                  {vendor.address}, {vendor.city}, {vendor.country}
                </span>
              </div>
            </div>
          </Card>

          {/* Service trades table */}
          <Card title="Registered Service Divisions" subtitle="Trade lists and active scopes of work">
            {services.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No trade categories registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">Division</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Subcategory / Trade</th>
                      <th className="py-2.5 px-3 text-right">Scope of Work</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {services.map((svc: any) => (
                      <tr key={svc.id}>
                        <td className="py-3 px-3">{svc.subCategory?.category?.mainCategory?.name}</td>
                        <td className="py-3 px-3">{svc.subCategory?.category?.name}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{svc.subCategory?.name}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {svc.scopes.map((scope: string) => (
                              <span
                                key={scope}
                                className="inline-flex px-1.5 py-0.5 roundedbg-slate-150 text-[10px] font-bold bg-slate-100 text-slate-600"
                              >
                                {scope.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Action card */}
        <div className="flex flex-col gap-6">
          {vendor.status !== 'APPROVED' && (
            <Card title="Compliance Action" subtitle="Verify and audit this contractor application">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Onboarding Progress</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-xs font-medium">Form Completion</span>
                  <span className="font-bold text-sm">{vendor.profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${vendor.profileCompletion}%` }} />
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 mt-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Set Account Status</span>
                  
                  <Button
                    onClick={handleApprove}
                    isLoading={statusMutation.isPending && statusMutation.variables?.status === 'APPROVED'}
                    disabled={false}
                    className="w-full flex items-center justify-center gap-2 select-none"
                  >
                    <Check className="h-4.5 w-4.5" /> Approve Contractor
                  </Button>

                  <Button
                    onClick={handleReject}
                    variant="danger"
                    isLoading={statusMutation.isPending && statusMutation.variables?.status === 'REJECTED'}
                    disabled={vendor.status === 'REJECTED'}
                    className="w-full flex items-center justify-center gap-2 select-none"
                  >
                    <X className="h-4.5 w-4.5" /> Reject Contractor
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card title="Security Profile" subtitle="Account credential records">
            <div className="flex flex-col gap-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-slate-400">Account ID</span>
                <span className="font-mono text-xxs font-bold text-slate-800 break-all select-all">{vendor.userId}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-slate-400">Registered Email</span>
                <span>{vendor.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-slate-400">System Role</span>
                <span className="font-bold text-slate-800">{vendor.user?.role || 'VENDOR'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={handleConfirmClose}
        title={confirmAction === 'APPROVED' ? 'Approve Contractor Application' : 'Reject Contractor Application'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleConfirmClose} disabled={statusMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'APPROVED' ? 'primary' : 'danger'}
              onClick={handleConfirmSubmit}
              isLoading={statusMutation.isPending}
            >
              {confirmAction === 'APPROVED' ? 'Approve Contractor' : 'Reject Contractor'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          {confirmAction === 'APPROVED'
            ? `Are you sure you want to approve the onboarding application for ${vendor.companyName || vendor.ownerName}? Once approved, they will be activated in the contractor network database.`
            : `Are you sure you want to reject the application for ${vendor.companyName || vendor.ownerName}? They will be marked as rejected and excluded from active vendor queries.`}
        </p>
      </Modal>
    </div>
  );
};

export const VendorDetails = React.memo(VendorDetailsComponent);
VendorDetails.displayName = 'VendorDetails';
export default VendorDetails;
