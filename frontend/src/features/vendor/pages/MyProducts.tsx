import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { Plus, Trash2, Package, Inbox, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/Modal/Modal';

export const MyProducts: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');

  // Fetch Vendor Profile (to check locked state)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
  });

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['vendorProducts'],
    queryFn: vendorApi.getProducts,
  });

  // Add Product Mutation
  const addMutation = useMutation({
    mutationFn: vendorApi.addProduct,
    onSuccess: () => {
      toastService.success('Product added successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProfileCompletion'] });
      setIsOpen(false);
      setName('');
      setBrand('');
      setDescription('');
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to add product';
      logger.error('Failed to add product', error);
      toastService.error(errMsg);
    },
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: vendorApi.deleteProduct,
    onSuccess: () => {
      toastService.success('Product deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProfileCompletion'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete product';
      logger.error('Failed to delete product', error);
      toastService.error(errMsg);
    },
  });

  const isLocked = !profile || (profile.isSubmitted && profile.status !== 'APPROVED');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastService.error('Product Name is required');
      return;
    }
    addMutation.mutate({
      name: name.trim(),
      brand: brand.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const handleDelete = (id: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete the product "${productName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoadingProfile || isLoadingProducts) return <Loader />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Product Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add and manage products supplied by your organization.
          </p>
        </div>
        {!isLocked && (
          <Button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 text-amber-800 select-none">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold">Catalog locked under review</p>
            <p className="text-xxs text-amber-700 mt-0.5 leading-relaxed">
              Your profile is currently submitted and undergoing administrative compliance review. Editing product catalog options is locked.
            </p>
          </div>
        </div>
      )}

      <Card title="My Uploaded Products" subtitle="List of commercial items and equipment supplied">
        {products.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-350 border border-slate-100">
              <Inbox className="h-6 w-6 stroke-1.25" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No products uploaded yet</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[280px] mx-auto leading-relaxed">
                Add the materials, products, or machinery that you offer to active projects.
              </p>
            </div>
            {!isLocked && (
              <Button onClick={() => setIsOpen(true)} variant="secondary" className="text-xs mt-1.5">
                Upload Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: any) => (
              <div
                key={product.id}
                className="p-4 rounded-xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </span>
                    {!isLocked && (
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-slate-400 hover:text-red-650 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {product.brand && (
                    <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      Brand: {product.brand}
                    </span>
                  )}
                  {product.description && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed break-words font-medium">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="text-[9px] text-slate-350 font-medium border-t border-slate-50 pt-2.5 flex items-center justify-between">
                  <span>Uploaded</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Product to Catalog"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-650 uppercase tracking-wider block mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Saudi Sandlime Bricks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-350"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-650 uppercase tracking-wider block mb-1.5">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              placeholder="e.g. Al-Fozan Polymers"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-355"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-655 uppercase tracking-wider block mb-1.5">
              Description / Specifications
            </label>
            <textarea
              placeholder="e.g. High density thermal block, standard dimensions 200x200x400 mm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-350 resize-none font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addMutation.isPending} disabled={!name.trim()}>
              Add Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyProducts;
