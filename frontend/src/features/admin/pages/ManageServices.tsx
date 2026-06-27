import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../../../api/serviceApi';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { Modal } from '../../../components/Modal/Modal';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { Plus, Trash2, PlusCircle, Layers, Folder, X } from 'lucide-react';

const ManageServicesComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'MAIN_CATEGORY' | 'CATEGORY' | 'SUB_CATEGORY'>('MAIN_CATEGORY');
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetLabel, setDeleteTargetLabel] = useState<string | null>(null);

  // Fetch full hierarchy
  const { data: hierarchy = [], isLoading } = useQuery({
    queryKey: ['adminServiceHierarchy'],
    queryFn: serviceApi.getServiceHierarchy,
  });

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: serviceApi.createService,
    onSuccess: () => {
      toastService.success('Service level category created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminServiceHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['serviceHierarchy'] });
      closeModal();
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to create service node';
      logger.error('Failed to create service node', error);
      toastService.error(errMsg);
    },
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: serviceApi.deleteService,
    onSuccess: () => {
      toastService.success('Category node removed');
      queryClient.invalidateQueries({ queryKey: ['adminServiceHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['serviceHierarchy'] });
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetLabel(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete category node';
      logger.error('Failed to delete category node', error);
      toastService.error(errMsg);
    },
  });

  const openAddModal = useCallback(
    (type: 'MAIN_CATEGORY' | 'CATEGORY' | 'SUB_CATEGORY', pId: string | null = null, pName: string | null = null) => {
      setModalType(type);
      setParentId(pId);
      setParentName(pName);
      setServiceName('');
      setIsModalOpen(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setServiceName('');
    setParentId(null);
    setParentName(null);
  }, []);

  const handleDelete = useCallback(
    (id: string, label: string) => {
      setDeleteTargetId(id);
      setDeleteTargetLabel(label);
      setIsDeleteOpen(true);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!serviceName.trim()) {
        toastService.warn('Category name cannot be empty');
        return;
      }
      createMutation.mutate({
        type: modalType,
        name: serviceName.trim(),
        parentId: parentId || undefined,
      });
    },
    [modalType, serviceName, parentId, createMutation]
  );

  const plusIcon = useMemo(() => <Plus className="h-4 w-4" />, []);
  const layersIcon = useMemo(() => <Layers className="h-4.5 w-4.5 text-primary shrink-0" />, []);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Onboarding Categories</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define construction divisions, trade categories, and scope configurations
          </p>
        </div>

        <Button
          onClick={() => openAddModal('MAIN_CATEGORY')}
          className="flex items-center gap-1.5 select-none"
        >
          {plusIcon} Add Division
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hierarchy.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm text-slate-400">No divisions registered yet. Click &apos;Add Division&apos; above.</p>
          </Card>
        ) : (
          hierarchy.map((mainCat) => (
            <div key={mainCat.id} className="bg-white border border-slate-150/70 rounded-xl shadow-xxs hover:shadow-xs transition-shadow overflow-hidden">
              
              {/* Main Category / Division Header Card */}
              <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-2.5 flex items-center justify-between border-b border-slate-150/70">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center border border-emerald-100/50">
                    {layersIcon}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 text-xs tracking-tight block">
                      {mainCat.name}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                      Division
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openAddModal('CATEGORY', mainCat.id, mainCat.name)}
                    className="inline-flex items-center gap-1 text-xxs font-bold text-primary bg-emerald-50/50 border border-emerald-100/40 hover:bg-primary hover:text-white hover:border-transparent px-2.5 py-1.5 rounded-lg transition-all cursor-pointer select-none"
                  >
                    <PlusCircle className="h-3 w-3 shrink-0" /> Add Category
                  </button>
                  <button
                    onClick={() => handleDelete(mainCat.id, mainCat.name)}
                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Division"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Categories container */}
              <div className="px-4 py-1 divide-y divide-slate-100">
                {(mainCat.categories || []).map((cat: any) => (
                  <div key={cat.id} className="py-3 flex flex-col gap-2">
                    
                    {/* Category Label Section */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-700 text-xs">{cat.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                            Category
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAddModal('SUB_CATEGORY', cat.id, cat.name)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-650 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none"
                        >
                          <PlusCircle className="h-3 w-3 shrink-0" /> Add Trade
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories (Trades) list tags */}
                    <div className="pl-5.5 flex flex-wrap gap-1.5">
                      {(cat.subCategories || []).map((sub: any) => (
                        <div
                          key={sub.id}
                          className="inline-flex items-center gap-1.5 bg-slate-50/50 border border-slate-200/50 py-1 pl-2.5 pr-1.5 rounded-lg text-slate-650 text-xxs font-medium hover:border-slate-350 hover:bg-white transition-all shadow-xxs group"
                        >
                          <span className="flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-emerald-500" />
                            {sub.name}
                          </span>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="text-slate-350 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-all opacity-60 group-hover:opacity-100 cursor-pointer"
                            title="Delete Trade"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(cat.subCategories || []).length === 0 && (
                        <span className="text-xxs text-slate-400 italic font-medium ml-1">
                          No subcategory trades registered under this branch.
                        </span>
                      )}
                    </div>

                  </div>
                ))}
                {(mainCat.categories || []).length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    No categories registered. Click &apos;Add Category&apos; above.
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ============ ADD NODE MODAL ============ */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalType === 'MAIN_CATEGORY'
            ? 'Add New Division'
            : modalType === 'CATEGORY'
            ? 'Add Category'
            : 'Add Subcategory / Trade'
        }
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeModal} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Save Category
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {parentName && (
            <div className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl text-xs flex flex-col gap-0.5 text-slate-650">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">
                Adding under parent:
              </span>
              <p className="font-bold text-slate-700">{parentName}</p>
            </div>
          )}

          <Input
            label={
              modalType === 'MAIN_CATEGORY'
                ? 'Division Name'
                : modalType === 'CATEGORY'
                ? 'Category Name'
                : 'Subcategory / Trade Name'
            }
            type="text"
            placeholder="e.g. Civil Works, Drywall Installation"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            autoFocus
          />
        </form>
      </Modal>

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteTargetId(null); setDeleteTargetLabel(null); }}
        title="Remove Category Node"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setIsDeleteOpen(false); setDeleteTargetId(null); setDeleteTargetLabel(null); }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteTargetId) {
                  deleteMutation.mutate(deleteTargetId);
                }
              }}
              isLoading={deleteMutation.isPending}
              className="!bg-red-600 hover:!bg-red-700"
            >
              Delete Node
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to remove the category node <span className="font-bold text-slate-850">&quot;{deleteTargetLabel}&quot;</span>? This will permanently delete this node and all of its cascading subcategories/trades. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export const ManageServices = React.memo(ManageServicesComponent);
ManageServices.displayName = 'ManageServices';
export default ManageServices;
