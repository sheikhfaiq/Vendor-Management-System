import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { serviceApi } from '../../../api/serviceApi';
import { Table } from '../../../components/Table/Table';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Checkbox } from '../../../components/Checkbox/Checkbox';
import { Card } from '../../../components/Card/Card';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { Plus, Trash2, Edit, ChevronRight, FolderOpen, Layers, X } from 'lucide-react';
import type { ScopeOfWork, MainCategory, Category, SubCategory } from '../../../types';

const ALL_SCOPES: { value: ScopeOfWork; label: string }[] = [
  { value: 'DESIGN_ENGINEERING', label: 'Design & Engineering' },
  { value: 'SUPPLY', label: 'Supply' },
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'TESTING_COMMISSIONING', label: 'Testing & Commissioning' },
];

// Pending item to be added in bulk
interface PendingService {
  subCategoryId: string;
  subCategoryName: string;
  categoryName: string;
  mainCategoryName: string;
  scopes: ScopeOfWork[];
}

const MyServicesComponent: React.FC = () => {
  const queryClient = useQueryClient();

  // --- Panel visibility ---
  const [showPicker, setShowPicker] = useState(false);

  // --- Picker navigation state ---
  const [expandedMainCat, setExpandedMainCat] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // --- Pending basket: services user wants to add in bulk ---
  const [pendingServices, setPendingServices] = useState<PendingService[]>([]);

  // --- Edit modal state ---
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editScopes, setEditScopes] = useState<ScopeOfWork[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- Delete confirmation modal state ---
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // =================== API QUERIES ===================

  const { data: myServices = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['myServices'],
    queryFn: vendorApi.getServices,
  });

  const { data: mainCategories = [] } = useQuery({
    queryKey: ['mainCategories'],
    queryFn: serviceApi.getMainCategories,
  });

  const { data: categoriesMap, isLoading: _loadingCats } = useQuery({
    queryKey: ['categories', expandedMainCat],
    queryFn: () => serviceApi.getCategories(expandedMainCat!),
    enabled: !!expandedMainCat,
  });

  const { data: subCategoriesMap, isLoading: _loadingSubs } = useQuery({
    queryKey: ['subCategories', expandedCat],
    queryFn: () => serviceApi.getSubCategories(expandedCat!),
    enabled: !!expandedCat,
  });

  const categories: Category[] = categoriesMap || [];
  const subCategories: SubCategory[] = subCategoriesMap || [];

  // =================== MUTATIONS ===================

  const addMutation = useMutation({
    mutationFn: vendorApi.addService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to add service';
      logger.error('Failed to add service', error);
      toastService.error(errMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, scopes }: { id: string; scopes: ScopeOfWork[] }) =>
      vendorApi.updateService(id, { scopes }),
    onSuccess: () => {
      toastService.success('Service scopes updated');
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      setIsEditModalOpen(false);
      setEditingService(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update service';
      logger.error('Failed to update service', error);
      toastService.error(errMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vendorApi.deleteService,
    onSuccess: () => {
      toastService.success('Service trade removed');
      queryClient.invalidateQueries({ queryKey: ['myServices'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete service';
      logger.error('Failed to delete service', error);
      toastService.error(errMsg);
    },
  });

  // =================== HELPERS ===================

  // Check if a subcategory is already registered
  const isAlreadyRegistered = useCallback(
    (subCatId: string) => myServices.some((s: any) => s.subCategoryId === subCatId),
    [myServices]
  );

  // Check if a subcategory is in the pending basket
  const isPending = useCallback(
    (subCatId: string) => pendingServices.some((p) => p.subCategoryId === subCatId),
    [pendingServices]
  );

  // Get the current main category name from the expanded ID
  const expandedMainCatName = useMemo(
    () => mainCategories.find((mc: MainCategory) => mc.id === expandedMainCat)?.name || '',
    [mainCategories, expandedMainCat]
  );

  // Get expanded category name
  const expandedCatName = useMemo(
    () => categories.find((c: Category) => c.id === expandedCat)?.name || '',
    [categories, expandedCat]
  );

  // =================== ACTIONS ===================

  const toggleMainCat = useCallback(
    (id: string) => {
      setExpandedMainCat((prev) => (prev === id ? null : id));
      setExpandedCat(null);
    },
    []
  );

  const toggleCat = useCallback(
    (id: string) => {
      setExpandedCat((prev) => (prev === id ? null : id));
    },
    []
  );

  const addToPending = useCallback(
    (subCat: SubCategory) => {
      if (isAlreadyRegistered(subCat.id) || isPending(subCat.id)) return;
      setPendingServices((prev) => [
        ...prev,
        {
          subCategoryId: subCat.id,
          subCategoryName: subCat.name,
          categoryName: expandedCatName,
          mainCategoryName: expandedMainCatName,
          scopes: ['SUPPLY', 'INSTALLATION'] as ScopeOfWork[], // default scopes
        },
      ]);
    },
    [isAlreadyRegistered, isPending, expandedCatName, expandedMainCatName]
  );

  const removeFromPending = useCallback((subCatId: string) => {
    setPendingServices((prev) => prev.filter((p) => p.subCategoryId !== subCatId));
  }, []);

  const updatePendingScopes = useCallback((subCatId: string, scope: ScopeOfWork, checked: boolean) => {
    setPendingServices((prev) =>
      prev.map((p) => {
        if (p.subCategoryId !== subCatId) return p;
        const newScopes = checked
          ? [...p.scopes, scope]
          : p.scopes.filter((s) => s !== scope);
        return { ...p, scopes: newScopes };
      })
    );
  }, []);

  // Submit all pending services in sequence
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAllPending = useCallback(async () => {
    const valid = pendingServices.filter((p) => p.scopes.length > 0);
    if (valid.length === 0) {
      toastService.warn('Add at least one service with scopes selected');
      return;
    }
    setIsSubmitting(true);
    let successCount = 0;
    for (const item of valid) {
      try {
        await addMutation.mutateAsync({
          subCategoryId: item.subCategoryId,
          scopes: item.scopes,
        });
        successCount++;
      } catch {
        // error handled in mutation onError
      }
    }
    setIsSubmitting(false);
    if (successCount > 0) {
      toastService.success(`${successCount} service trade${successCount > 1 ? 's' : ''} added successfully`);
      setPendingServices([]);
      setShowPicker(false);
    }
  }, [pendingServices, addMutation]);

  // Edit modal handlers
  const openEditModal = useCallback((service: any) => {
    setEditingService(service);
    setEditScopes(service.scopes);
    setIsEditModalOpen(true);
  }, []);

  const handleEditScopeChange = useCallback((scope: ScopeOfWork, checked: boolean) => {
    setEditScopes((prev) =>
      checked ? [...prev, scope] : prev.filter((s) => s !== scope)
    );
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (editScopes.length === 0) {
      toastService.warn('Select at least one scope');
      return;
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, scopes: editScopes });
    }
  }, [editingService, editScopes, updateMutation]);

  // Delete handlers
  const openDeleteModal = useCallback((service: any) => {
    setDeleteTarget(service);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }, [deleteTarget, deleteMutation]);

  // =================== TABLE COLUMNS ===================

  const columns = useMemo(
    () => [
      {
        key: 'mainCategory',
        label: 'Division',
        render: (row: any) => row.subCategory?.category?.mainCategory?.name || 'N/A',
      },
      {
        key: 'category',
        label: 'Category',
        render: (row: any) => row.subCategory?.category?.name || 'N/A',
      },
      {
        key: 'subCategory',
        label: 'Subcategory / Trade',
        render: (row: any) => row.subCategory?.name || 'N/A',
      },
      {
        key: 'scopes',
        label: 'Registered Scopes',
        render: (row: any) => (
          <div className="flex flex-wrap gap-1.5">
            {row.scopes.map((scope: string) => (
              <span
                key={scope}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100/50"
              >
                {scope.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: any) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(row)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Edit Scopes"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteModal(row)}
              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
              title="Delete Trade"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [openEditModal, openDeleteModal]
  );

  // =================== RENDER ===================

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Registered Trades</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add or update the construction divisions and scopes of work your business operates in
          </p>
        </div>
        <Button
          onClick={() => { setShowPicker(true); setPendingServices([]); }}
          className="flex items-center gap-1.5 select-none"
        >
          <Plus className="h-4 w-4" /> Add Trades
        </Button>
      </div>

      {/* ============ INLINE SERVICE PICKER PANEL ============ */}
      {showPicker && (
        <Card
          title="Select Service Trades"
          subtitle="Browse divisions → categories → trades, then add multiple at once"
        >
          <div className="flex flex-col gap-5">
            {/* Three-column cascading browser */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden min-h-[320px]">

              {/* Column 1: Main Categories (Divisions) */}
              <div className="border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-100/60">
                  <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Divisions</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[320px]">
                  {mainCategories.map((mc: MainCategory) => (
                    <button
                      key={mc.id}
                      onClick={() => toggleMainCat(mc.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-all border-b border-slate-100 cursor-pointer ${
                        expandedMainCat === mc.id
                          ? 'bg-primary/5 text-primary font-bold border-l-2 border-l-primary'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        {mc.name}
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${expandedMainCat === mc.id ? 'rotate-90' : ''}`} />
                    </button>
                  ))}
                  {mainCategories.length === 0 && (
                    <p className="text-xxs text-slate-400 p-4 text-center">No divisions available</p>
                  )}
                </div>
              </div>

              {/* Column 2: Categories */}
              <div className="border-r border-slate-200 bg-white flex flex-col">
                <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-100/60">
                  <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">
                    {expandedMainCat ? `Categories in ${expandedMainCatName}` : 'Categories'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[320px]">
                  {!expandedMainCat && (
                    <p className="text-xxs text-slate-400 p-4 text-center">← Select a division</p>
                  )}
                  {expandedMainCat && categories.map((c: Category) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCat(c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-all border-b border-slate-100 cursor-pointer ${
                        expandedCat === c.id
                          ? 'bg-primary/5 text-primary font-bold border-l-2 border-l-primary'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        {c.name}
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${expandedCat === c.id ? 'rotate-90' : ''}`} />
                    </button>
                  ))}
                  {expandedMainCat && categories.length === 0 && (
                    <p className="text-xxs text-slate-400 p-4 text-center">No categories found</p>
                  )}
                </div>
              </div>

              {/* Column 3: Subcategories / Trades */}
              <div className="bg-white flex flex-col">
                <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-100/60">
                  <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">
                    {expandedCat ? `Trades in ${expandedCatName}` : 'Trades'}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[320px]">
                  {!expandedCat && (
                    <p className="text-xxs text-slate-400 p-4 text-center">← Select a category</p>
                  )}
                  {expandedCat && subCategories.map((sc: SubCategory) => {
                    const registered = isAlreadyRegistered(sc.id);
                    const pending = isPending(sc.id);
                    return (
                      <div
                        key={sc.id}
                        className={`flex items-center justify-between px-3 py-2.5 text-xs border-b border-slate-100 ${
                          registered ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <span className={`font-medium ${registered ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {sc.name}
                        </span>
                        {registered ? (
                          <span className="text-xxs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Registered
                          </span>
                        ) : pending ? (
                          <button
                            onClick={() => removeFromPending(sc.id)}
                            className="text-xxs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="h-3 w-3" /> Added
                          </button>
                        ) : (
                          <button
                            onClick={() => addToPending(sc)}
                            className="text-xxs font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {expandedCat && subCategories.length === 0 && (
                    <p className="text-xxs text-slate-400 p-4 text-center">No trades found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pending basket */}
            {pendingServices.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">
                    Selected Trades ({pendingServices.length})
                  </h3>
                  <button
                    onClick={() => setPendingServices([])}
                    className="text-xxs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {pendingServices.map((item, idx) => (
                    <div
                      key={item.subCategoryId}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${
                        idx > 0 ? 'border-t border-slate-100' : ''
                      }`}
                    >
                      {/* Trade info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.subCategoryName}</p>
                        <p className="text-xxs text-slate-400 truncate">
                          {item.mainCategoryName} › {item.categoryName}
                        </p>
                      </div>

                      {/* Scope checkboxes inline */}
                      <div className="flex flex-wrap items-center gap-3">
                        {ALL_SCOPES.map((s) => (
                          <Checkbox
                            key={s.value}
                            label={s.label}
                            checked={item.scopes.includes(s.value)}
                            onChange={(e) => updatePendingScopes(item.subCategoryId, s.value, e.target.checked)}
                          />
                        ))}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromPending(item.subCategoryId)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => { setShowPicker(false); setPendingServices([]); }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitAllPending}
                isLoading={isSubmitting}
                disabled={pendingServices.length === 0}
              >
                Register {pendingServices.length > 0 ? `${pendingServices.length} Trade${pendingServices.length > 1 ? 's' : ''}` : 'Trades'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ============ REGISTERED SERVICES TABLE ============ */}
      <Table
        columns={columns}
        data={myServices}
        isLoading={isLoadingServices}
        emptyStateText="No registered service trades yet. Click 'Add Trades' to configure."
      />

      {/* ============ EDIT SCOPES MODAL ============ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingService(null); }}
        title="Edit Registered Scopes"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setIsEditModalOpen(false); setEditingService(null); }}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} isLoading={updateMutation.isPending}>
              Update Scopes
            </Button>
          </div>
        }
      >
        {editingService && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex flex-col gap-1 text-slate-600">
              <span className="font-semibold text-slate-800">Editing Trade:</span>
              <p>
                {editingService.subCategory?.category?.mainCategory?.name} &gt;{' '}
                {editingService.subCategory?.category?.name} &gt;{' '}
                <span className="font-bold">{editingService.subCategory?.name}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Scope of Work
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {ALL_SCOPES.map((opt) => (
                  <Checkbox
                    key={opt.value}
                    label={opt.label}
                    checked={editScopes.includes(opt.value)}
                    onChange={(e) => handleEditScopeChange(opt.value, e.target.checked)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
        title="Remove Service Trade"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} isLoading={deleteMutation.isPending} className="!bg-red-600 hover:!bg-red-700">
              Delete Trade
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-slate-600">
            Are you sure you want to remove{' '}
            <span className="font-bold text-slate-800">{deleteTarget.subCategory?.name}</span>{' '}
            from your registered trades? This action cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
};

export const MyServices = React.memo(MyServicesComponent);
MyServices.displayName = 'MyServices';
export default MyServices;
