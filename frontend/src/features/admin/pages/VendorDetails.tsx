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
import { ArrowLeft, Check, X, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { EditVendorModal } from '../../../components/EditVendorModal/EditVendorModal';
import { AddServiceModal } from '../../../components/AddServiceModal/AddServiceModal';
import { EditServiceScopesModal } from '../../../components/EditServiceScopesModal/EditServiceScopesModal';
import type { VendorProfile } from '../../../types';

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
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const addServiceMutation = useMutation({
    mutationFn: ({ subCategoryId, scopes }: { subCategoryId: string; scopes: string[] }) =>
      adminApi.addVendorService(id, subCategoryId, scopes),
    onSuccess: () => {
      toastService.success('Vendor service added successfully');
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', id] });
      setIsAddServiceOpen(false);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to add vendor service';
      logger.error('Failed to add vendor service', error);
      toastService.error(errMsg);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, scopes }: { serviceId: string; scopes: string[] }) =>
      adminApi.updateVendorService(id, serviceId, scopes),
    onSuccess: () => {
      toastService.success('Vendor service scopes updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', id] });
      setIsEditServiceOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update service scopes';
      logger.error('Failed to update service scopes', error);
      toastService.error(errMsg);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) => adminApi.deleteVendorService(id, serviceId),
    onSuccess: () => {
      toastService.success('Vendor service mapping removed successfully');
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', id] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to remove vendor service';
      logger.error('Failed to remove service mapping', error);
      toastService.error(errMsg);
    },
  });

  const handleEditServiceClick = useCallback((svc: any) => {
    setSelectedService(svc);
    setIsEditServiceOpen(true);
  }, []);

  const handleDeleteServiceClick = useCallback(async (serviceId: string) => {
    if (window.confirm('Are you sure you want to remove this service division from the contractor profile?')) {
      await deleteServiceMutation.mutateAsync(serviceId);
    }
  }, [deleteServiceMutation]);

  const editMutation = useMutation({
    mutationFn: (data: Partial<VendorProfile>) => adminApi.updateVendorProfile(id, data),
    onSuccess: () => {
      toastService.success('Vendor profile details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminVendorDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update vendor profile';
      logger.error('Failed to update profile', error);
      toastService.error(errMsg);
    },
  });

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
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

        <div className="flex items-center gap-3 select-none">
          <Button
            onClick={() => setIsEditOpen(true)}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs py-1.5 px-3 border-slate-200 text-slate-650 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>

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
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Vendor Role</span>
                <span className="font-bold text-slate-700">{vendor.businessCategory || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Primary Contact / Owner</span>
                <span>{vendor.ownerName || 'N/A'}</span>
              </div>
              {vendor.vendorType === 'COMPANY' && (
                <>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Company Name</span>
                    <span>{vendor.companyName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Trade License #</span>
                    <span className="font-mono text-slate-700 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {vendor.tradeLicenseNo || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Tax TRN #</span>
                    <span className="font-mono text-slate-700 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {vendor.taxRegistrationNo || 'N/A'}
                    </span>
                  </div>
                </>
              )}
              <div>
                <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Phone</span>
                <span>{vendor.phone || 'N/A'}</span>
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
                  {vendor.address
                    ? [vendor.address, vendor.city, vendor.region, vendor.country].filter(Boolean).join(', ')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Service trades table */}
          <Card
            title="Registered Service Divisions"
            subtitle="Trade lists and active scopes of work"
            headerAction={
              <Button
                onClick={() => setIsAddServiceOpen(true)}
                variant="secondary"
                className="flex items-center gap-1 text-xs py-1 px-2.5 border-slate-200 text-slate-650 hover:bg-slate-50 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Service
              </Button>
            }
          >
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
                      <th className="py-2.5 px-3">Scope of Work</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {services.map((svc: any) => (
                      <tr key={svc.id}>
                        <td className="py-3 px-3">{svc.subCategory?.category?.mainCategory?.name}</td>
                        <td className="py-3 px-3">{svc.subCategory?.category?.name}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{svc.subCategory?.name}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1.5">
                            {svc.scopes.map((scope: string) => (
                              <span
                                key={scope}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/50"
                              >
                                {scope.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleEditServiceClick(svc)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                              title="Edit Service Scopes"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteServiceClick(svc.id)}
                              className="p-1.5 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded transition-colors"
                              title="Delete Service Mapping"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {/* Compliance documents list */}
          <Card title="Compliance Business Documents" subtitle="Licenses, tax registries, and validation certificates">
            {vendor.documents && vendor.documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No compliance documents uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">Document Type</th>
                      <th className="py-2.5 px-3">Document Number</th>
                      <th className="py-2.5 px-3">Filename</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-650 font-medium">
                    {vendor.documents?.map((doc: any) => {
                      const baseName = doc.fileKey.replace(/^documents\//, '');
                      const prefixRegex = /^[a-f0-9-]{36}-\d{13}-[a-f0-9]{8}-/;
                      const cleanName = baseName.replace(prefixRegex, '');
                      const kbs = (doc.fileSize / 1024).toFixed(1);

                      return (
                        <tr key={doc.id}>
                          <td className="py-3 px-3 font-semibold text-slate-800">{doc.name}</td>
                          <td className="py-3 px-3 text-slate-650 font-bold">{doc.documentNumber || 'N/A'}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-xxs max-w-[200px] truncate">{cleanName}</td>
                          <td className="py-3 px-3 text-slate-400">{kbs} KB</td>
                          <td className="py-3 px-3 text-right">
                            <a
                              href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5050'}${doc.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </a>
                          </td>
                        </tr>
                      );
                    })}
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

      <EditVendorModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        vendor={vendor}
        onSave={async (data) => {
          await editMutation.mutateAsync(data);
        }}
        isSaving={editMutation.isPending}
      />

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onAdd={async (subCategoryId, scopes) => {
          await addServiceMutation.mutateAsync({ subCategoryId, scopes });
        }}
        isAdding={addServiceMutation.isPending}
        existingSubCategoryIds={services.map((s: any) => s.subCategoryId)}
      />

      <EditServiceScopesModal
        isOpen={isEditServiceOpen}
        onClose={() => {
          setIsEditServiceOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
        onSave={async (serviceId, scopes) => {
          await updateServiceMutation.mutateAsync({ serviceId, scopes });
        }}
        isSaving={updateServiceMutation.isPending}
      />
    </div>
  );
};

export const VendorDetails = React.memo(VendorDetailsComponent);
VendorDetails.displayName = 'VendorDetails';
export default VendorDetails;
