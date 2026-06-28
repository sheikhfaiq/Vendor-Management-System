import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Table } from '../../../components/Table/Table';
import { Loader } from '../../../components/Loader/Loader';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import {
  Shield,
  User as UserIcon,
  Phone,
  Globe,
  MapPin,
  Check,
  X,
  FileCheck,
  ExternalLink,
  Info,
  FileText,
} from 'lucide-react';
import type { User } from '../../../types';

const ManageUsersComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Status mutation variables
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

  // Fetch users query
  const { data: result, isLoading } = useQuery({
    queryKey: ['adminUsers', currentPage],
    queryFn: () => adminApi.listUsers({ page: currentPage, limit: 10 }),
  });

  const users = useMemo(() => result?.data || [], [result]);
  const totalPages = result?.pagination?.totalPages || 1;

  // Selected Vendor Detail query
  const vendorId = selectedUser?.vendorProfile?.id;
  const { data: vendorDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['adminVendorDetails', vendorId],
    queryFn: () => adminApi.getVendorDetails(vendorId!),
    enabled: !!vendorId,
  });

  // Mutation to update vendor status from the inspector card
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
      adminApi.updateVendorStatus(id, status),
    onSuccess: (data) => {
      toastService.success(`Vendor status updated to ${data.status} successfully`);
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers', currentPage] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      setIsConfirmOpen(false);
      setConfirmAction(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update vendor status';
      logger.error('Failed to change status in inspector', error);
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
    if (confirmAction && vendorId) {
      statusMutation.mutate({ id: vendorId, status: confirmAction });
    }
  }, [confirmAction, vendorId, statusMutation]);

  const handleConfirmClose = useCallback(() => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
  }, []);

  const handleRowClick = useCallback((row: User) => {
    setSelectedUser(row);
  }, []);

  // Columns for the users table
  const columns = useMemo(
    () => [
      {
        key: 'email',
        label: 'User Credentials',
        render: (row: any) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              {row.role === 'ADMIN' ? (
                <Shield className="h-4 w-4 text-primary" />
              ) : (
                <UserIcon className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div>
              <span className="font-bold text-slate-800 block">{row.email}</span>
              <span className="text-[10px] text-slate-400 font-mono select-all break-all">{row.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'System Access Privilege',
        render: (row: any) => (
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold ${
              row.role === 'ADMIN'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {row.role}
          </span>
        ),
      },
      {
        key: 'company',
        label: 'Associated Contractor / Company',
        render: (row: any) => {
          if (row.role === 'ADMIN') return <span className="text-slate-450 italic text-xxs font-medium">N/A (Staff)</span>;
          if (!row.vendorProfile) return <span className="text-slate-450 italic text-xxs font-medium">Not Onboarded</span>;
          return (
            <span className="font-semibold text-slate-800">
              {row.vendorProfile.companyName || row.vendorProfile.ownerName || 'Individual'}
            </span>
          );
        },
      },
      {
        key: 'vendorProfile',
        label: 'Linked Profile Status',
        render: (row: any) => {
          if (row.role === 'ADMIN') return <span className="text-slate-400 italic text-xxs font-medium">N/A (Staff)</span>;
          if (!row.vendorProfile) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-semibold bg-gray-50 text-gray-500 border border-gray-100">
                Not Formed
              </span>
            );
          }
          const status = row.vendorProfile.status;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold border ${
                status === 'APPROVED'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Registration Date',
        render: (row: any) => (
          <span className="text-slate-500 font-semibold">
            {new Date(row.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Access Control</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage admin and contractor login credentials, inspect profile sheets, and verify compliance documents in real time.
        </p>
      </div>

      {/* Split master-detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start w-full">
        {/* Left Side: Users Table */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="overflow-hidden shadow-md border border-slate-100 rounded-2xl">
            <Table
              columns={columns}
              data={users}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onRowClick={handleRowClick}
              selectedRowId={selectedUser?.id}
              emptyStateText="No registered users found."
            />
          </Card>
        </div>

        {/* Right Side: Account Inspector Detail Sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!selectedUser ? (
            <Card
              title="Account Inspector"
              subtitle="Inspect details and security credentials"
              className="w-full shadow-md border border-slate-100 rounded-2xl h-[420px] flex flex-col justify-center items-center text-center p-6 bg-slate-50/40"
            >
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="p-4 bg-primary/5 text-primary rounded-full border border-primary/10">
                  <Shield className="h-8 w-8 text-primary/70" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No Account Selected</h3>
                  <p className="text-xs text-slate-400 max-w-[240px] mt-1.5 leading-relaxed mx-auto">
                    Select any credentials account row from the table on the left to inspect their profile records, status, and active scopes.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              title={`Account Inspector`}
              subtitle={`Credentials Email: ${selectedUser.email}`}
              className="w-full shadow-md border border-slate-100 rounded-2xl"
            >
              <div className="max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-5">
                {/* Case 1: Selected Admin */}
                {selectedUser.role === 'ADMIN' && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800">System Administrator</h3>
                    <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                      This user possesses full administrative privileges across VMS services. Role-based contractor actions do not apply.
                    </p>
                  </div>
                )}

                {/* Case 2: Selected Vendor but no profile completed yet */}
                {selectedUser.role === 'VENDOR' && !selectedUser.vendorProfile && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
                      <Info className="h-6 w-6" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800">Profile Not Yet Formed</h3>
                    <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                      This vendor access account is registered, but they have not completed their onboarding profile information sheet yet.
                    </p>
                  </div>
                )}

                {/* Case 3: Selected Vendor with profile details */}
                {selectedUser.role === 'VENDOR' && selectedUser.vendorProfile && (
                  <div className="flex flex-col gap-5">
                    {isLoadingDetails && (
                      <div className="flex justify-center py-8">
                        <Loader />
                      </div>
                    )}

                    {!isLoadingDetails && vendorDetails && (
                      <div className="flex flex-col gap-5">
                        {/* Onboarding Profile Card */}
                        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-3.5">
                          <div className="flex items-center justify-between border-b border-slate-250/20 pb-2">
                            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                              Onboarding Profile
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-bold border ${
                                vendorDetails.status === 'APPROVED'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : vendorDetails.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {vendorDetails.status}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2.5 text-xs">
                            <div>
                              <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                Company / Contractor Name
                              </span>
                              <span className="font-extrabold text-slate-800 text-sm">
                                {vendorDetails.companyName || 'Individual / Freelancer'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                Owner / Contact
                              </span>
                              <span className="font-semibold text-slate-700">{vendorDetails.ownerName}</span>
                            </div>
                            <div>
                              <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                Phone Number
                              </span>
                              <span className="font-mono text-slate-700 font-medium flex items-center gap-1">
                                <Phone className="h-3 w-3 opacity-45" /> {vendorDetails.phone}
                              </span>
                            </div>
                            {vendorDetails.website && (
                              <div>
                                <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                  Website Link
                                </span>
                                <a
                                  href={vendorDetails.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3 shrink-0" />
                                  Visit Website <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}
                            {vendorDetails.vendorType === 'COMPANY' && (
                              <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-slate-100">
                                <div>
                                  <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                    License #
                                  </span>
                                  <span className="font-mono text-xxs font-bold text-slate-600 bg-slate-150/40 px-1.5 py-0.5 rounded border border-slate-200/50">
                                    {vendorDetails.tradeLicenseNo}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-xxs text-slate-450 font-bold uppercase tracking-wider">
                                    Tax TRN
                                  </span>
                                  <span className="font-mono text-xxs font-bold text-slate-600 bg-slate-150/40 px-1.5 py-0.5 rounded border border-slate-200/50">
                                    {vendorDetails.taxRegistrationNo}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="border-t border-slate-100 pt-2.5 flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                              <span className="text-slate-500 font-medium">
                                {[vendorDetails.address, vendorDetails.city, vendorDetails.region, vendorDetails.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Documents List */}
                        {vendorDetails.documents && vendorDetails.documents.length > 0 && (
                          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-3">
                            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200/40 pb-1.5">
                              Uploaded Documents
                            </span>
                            <div className="flex flex-col gap-2">
                              {vendorDetails.documents.map((doc: any) => {
                                const baseName = doc.fileKey.replace(/^documents\//, '');
                                const prefixRegex = /^[a-f0-9-]{36}-\d{13}-[a-f0-9]{8}-/;
                                const cleanName = baseName.replace(prefixRegex, '');
                                return (
                                  <div key={doc.id} className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-150/60 hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="p-1.5 bg-primary/5 text-primary rounded-lg">
                                        <FileText className="h-4 w-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-700 truncate">{doc.name}</span>
                                        <span className="text-xxs font-medium text-slate-455 font-mono truncate max-w-[130px]">{cleanName}</span>
                                      </div>
                                    </div>
                                    <a
                                      href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5050'}${doc.fileUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 select-none"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" /> View
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Service Divisions List */}
                        <div className="border border-slate-200/60 rounded-xl overflow-hidden flex flex-col bg-white">
                          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200/60 flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-slate-450" />
                            <span className="text-xs font-bold text-slate-700">Registered Services & Trades</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/20">
                                  <th className="py-2 px-3">Division</th>
                                  <th className="py-2 px-3">Category</th>
                                  <th className="py-2 px-3">Trade</th>
                                  <th className="py-2 px-3 text-right">Scope</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 text-slate-650 font-medium">
                                {vendorDetails.services && vendorDetails.services.length > 0 ? (
                                  vendorDetails.services.map((svc: any) => (
                                    <tr key={svc.id} className="hover:bg-slate-50/40">
                                      <td className="py-2.5 px-3 text-slate-550 truncate max-w-[80px]">
                                        {svc.subCategory?.category?.mainCategory?.name}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-550 truncate max-w-[80px]">
                                        {svc.subCategory?.category?.name}
                                      </td>
                                      <td className="py-2.5 px-3 font-bold text-slate-800 truncate max-w-[85px]">
                                        {svc.subCategory?.name}
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <div className="flex flex-wrap gap-1 justify-end">
                                          {svc.scopes.map((scope: string) => (
                                            <span
                                              key={scope}
                                              className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200/10"
                                            >
                                              {scope.replace(/_/g, ' ')}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">
                                      No trades categories registered.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Status Change actions */}
                        {vendorDetails.status !== 'APPROVED' && (
                          <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                            <Button
                              onClick={handleApprove}
                              className="flex-1 flex items-center justify-center gap-1.5 select-none text-xs py-2"
                            >
                              <Check className="h-4 w-4" /> Approve Vendor
                            </Button>
                            <Button
                              onClick={handleReject}
                              variant="secondary"
                              className="flex-1 flex items-center justify-center gap-1.5 !text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 select-none text-xs py-2"
                            >
                              <X className="h-4 w-4" /> Reject Vendor
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ============ CONFIRM ACTION MODAL ============ */}
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
              onClick={handleConfirmSubmit}
              isLoading={statusMutation.isPending}
              className={confirmAction === 'REJECTED' ? '!bg-red-600 hover:!bg-red-700' : ''}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to change the onboarding review status of{' '}
          <span className="font-bold text-slate-850">
            {selectedUser?.vendorProfile?.companyName || selectedUser?.vendorProfile?.ownerName}
          </span>{' '}
          to <span className="font-bold underline">{confirmAction}</span>? This action updates compliance status in the contractors register database.
        </p>
      </Modal>
    </div>
  );
};

export const ManageUsers = React.memo(ManageUsersComponent);
ManageUsers.displayName = 'ManageUsers';
export default ManageUsers;
