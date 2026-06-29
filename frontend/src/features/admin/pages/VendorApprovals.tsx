import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Eye, Check, X, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';

export const VendorApprovals: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  // Query pending vendors with 5-second polling interval
  const { data, isLoading } = useQuery({
    queryKey: ['adminPendingApprovals', currentPage],
    queryFn: () => adminApi.listVendors({ page: currentPage, limit: 10, status: 'PENDING' }),
    refetchInterval: 5000, // Live poll every 5 seconds!
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      adminApi.updateVendorStatus(id, status),
    onSuccess: (resData) => {
      toastService.success(`Vendor application status updated to ${resData.status}`);
      queryClient.invalidateQueries({ queryKey: ['adminPendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      setConfirmTarget(null);
      setConfirmAction(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update status';
      logger.error('Failed to change status', error);
      toastService.error(errMsg);
    },
  });

  const handleOpenConfirm = useCallback((vendor: any, action: 'APPROVED' | 'REJECTED') => {
    setConfirmTarget(vendor);
    setConfirmAction(action);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setConfirmTarget(null);
    setConfirmAction(null);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    if (confirmTarget && confirmAction) {
      statusMutation.mutate({ id: confirmTarget.id, status: confirmAction });
    }
  }, [confirmTarget, confirmAction, statusMutation]);

  const vendors = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || { totalPages: 1 }, [data?.pagination]);

  const columns = useMemo(
    () => [
      {
        key: 'vendor',
        label: 'Contractor Name / Owner',
        render: (row: any) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-slate-800 tracking-tight">
              {row.companyName || row.ownerName || 'N/A'}
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              {row.vendorCode ? (
                <span className="text-primary font-bold mr-1">{row.vendorCode}</span>
              ) : null}
              {row.vendorCode ? '| ' : ''}{row.user?.email}
            </span>
          </div>
        ),
      },
      {
        key: 'vendorRole',
        label: 'Vendor Role',
        render: (row: any) => (
          <span className="text-slate-700 font-semibold">{row.businessCategory || 'N/A'}</span>
        ),
      },
      {
        key: 'vendorType',
        label: 'Type',
        render: (row: any) => (
          <span className="uppercase text-xxs font-bold text-slate-650 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {row.vendorType}
          </span>
        ),
      },
      {
        key: 'profileCompletion',
        label: 'Completion',
        render: (row: any) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">{row.profileCompletion}%</span>
            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${row.profileCompletion}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Submitted Date',
        render: (row: any) => (
          <span className="text-slate-500 font-medium">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: any) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/vendors/${row.id}`}
              className="p-1.5 text-slate-450 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors inline-block"
              title="Inspect Details"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleOpenConfirm(row, 'APPROVED')}
              className="p-1.5 text-emerald-555 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Quick Approve"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleOpenConfirm(row, 'REJECTED')}
              className="p-1.5 text-red-550 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Quick Reject"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleOpenConfirm]
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Onboarding Compliance Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit and approve pending registrations from companies and individual contractors.
          </p>
        </div>
      </div>

      <Card title="Pending Review Queue" subtitle="Contractors awaiting verification and trade activation">
        <Table
          columns={columns}
          data={vendors}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          emptyStateText="No pending contractor applications in review."
          dense={true}
        />
      </Card>

      <Modal
        isOpen={!!confirmTarget}
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
        {confirmTarget && (
          <p className="text-sm text-slate-655 leading-relaxed">
            {confirmAction === 'APPROVED'
              ? `Are you sure you want to approve the onboarding application for "${
                  confirmTarget.companyName || confirmTarget.ownerName
                }"? Once approved, they will be activated and allowed to register services.`
              : `Are you sure you want to reject the application for "${
                  confirmTarget.companyName || confirmTarget.ownerName
                }"? They will be flagged as rejected and blocked from trade catalogs.`}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default VendorApprovals;
