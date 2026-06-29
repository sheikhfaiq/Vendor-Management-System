import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { serviceApi } from '../../../api/serviceApi';
import { Card } from '../../../components/Card/Card';
import { Table } from '../../../components/Table/Table';
import { Input } from '../../../components/Input/Input';
import { Select } from '../../../components/Select/Select';
import { Search, Eye, ChevronRight, Layers, FolderOpen, X, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { EditVendorModal } from '../../../components/EditVendorModal/EditVendorModal';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import type { MainCategory, Category, SubCategory, VendorProfile } from '../../../types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const scopeOptions = [
  { value: '', label: 'All Scopes' },
  { value: 'DESIGN_ENGINEERING', label: 'Design & Engineering' },
  { value: 'SUPPLY', label: 'Supply' },
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'TESTING_COMMISSIONING', label: 'Testing & Commissioning' },
];

interface FilterTag {
  type: 'DIVISION' | 'CATEGORY' | 'TRADE';
  id: string;
  name: string;
}

const VendorListComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorProfile> }) =>
      adminApi.updateVendorProfile(id, data),
    onSuccess: () => {
      toastService.success('Vendor profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminVendors'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardRecentVendors'] });
      setIsEditOpen(false);
      setEditingVendor(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to update vendor profile';
      logger.error('Failed to update vendor profile', error);
      toastService.error(errMsg);
    },
  });

  const handleEditClick = useCallback((vendor: VendorProfile) => {
    setEditingVendor(vendor);
    setIsEditOpen(true);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedScope, setSelectedScope] = useState('');

  // Cascade browsing states
  const [expandedMainCat, setExpandedMainCat] = useState<string>('');
  const [expandedCat, setExpandedCat] = useState<string>('');

  // Active filter basket lists
  const [selectedMainCats, setSelectedMainCats] = useState<FilterTag[]>([]);
  const [selectedCats, setSelectedCats] = useState<FilterTag[]>([]);
  const [selectedSubCats, setSelectedSubCats] = useState<FilterTag[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedScope, selectedMainCats, selectedCats, selectedSubCats]);

  // Fetch divisions cascade
  const { data: mainCategories = [] } = useQuery({
    queryKey: ['mainCategories'],
    queryFn: serviceApi.getMainCategories,
  });

  const { data: categoriesMap, refetch: refetchCats } = useQuery({
    queryKey: ['categories', expandedMainCat],
    queryFn: () => serviceApi.getCategories(expandedMainCat),
    enabled: !!expandedMainCat,
  });

  const { data: subCategoriesMap, refetch: refetchSubs } = useQuery({
    queryKey: ['subCategories', expandedCat],
    queryFn: () => serviceApi.getSubCategories(expandedCat),
    enabled: !!expandedCat,
  });

  const categories = categoriesMap || [];
  const subCategories = subCategoriesMap || [];

  useEffect(() => {
    if (expandedMainCat) {
      refetchCats();
      setExpandedCat('');
    }
  }, [expandedMainCat, refetchCats]);

  useEffect(() => {
    if (expandedCat) {
      refetchSubs();
    }
  }, [expandedCat, refetchSubs]);

  // Join selected IDs for querying the backend
  const mainCategoryIdQuery = useMemo(() => selectedMainCats.map((x) => x.id).join(','), [selectedMainCats]);
  const categoryIdQuery = useMemo(() => selectedCats.map((x) => x.id).join(','), [selectedCats]);
  const subCategoryIdQuery = useMemo(() => selectedSubCats.map((x) => x.id).join(','), [selectedSubCats]);

  const isFilterActive =
    selectedMainCats.length > 0 ||
    selectedCats.length > 0 ||
    selectedSubCats.length > 0 ||
    !!selectedScope;

  const isSearchActive = !!searchTerm.trim();

  // Query vendors
  const { data: result, isLoading } = useQuery({
    queryKey: [
      'adminVendors',
      currentPage,
      searchTerm,
      selectedScope,
      mainCategoryIdQuery,
      categoryIdQuery,
      subCategoryIdQuery,
    ],
    queryFn: async () => {
      const pageParams = { page: currentPage, limit: 10 };
      if (isSearchActive) {
        return adminApi.searchVendors(searchTerm, pageParams);
      } else if (isFilterActive) {
        return adminApi.filterVendors(
          {
            mainCategoryId: mainCategoryIdQuery || undefined,
            categoryId: categoryIdQuery || undefined,
            subCategoryId: subCategoryIdQuery || undefined,
            scope: selectedScope || undefined,
          },
          pageParams
        );
      } else {
        return adminApi.listVendors(pageParams);
      }
    },
  });

  const vendorsList = useMemo(() => result?.data || [], [result]);
  const totalPages = result?.pagination?.totalPages || 1;

  // Client side status filter on the results of query (since filter endpoint handles categories/scopes)
  const filteredVendors = useMemo(() => {
    if (!selectedStatus) return vendorsList;
    return vendorsList.filter((v) => v.status === selectedStatus);
  }, [vendorsList, selectedStatus]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Basket modifications
  const toggleMainCatFilter = useCallback((mc: MainCategory) => {
    setSelectedMainCats((prev) => {
      if (prev.some((x) => x.id === mc.id)) {
        return prev.filter((x) => x.id !== mc.id);
      }
      return [...prev, { type: 'DIVISION', id: mc.id, name: mc.name }];
    });
  }, []);

  const toggleCatFilter = useCallback((c: Category) => {
    setSelectedCats((prev) => {
      if (prev.some((x) => x.id === c.id)) {
        return prev.filter((x) => x.id !== c.id);
      }
      return [...prev, { type: 'CATEGORY', id: c.id, name: c.name }];
    });
  }, []);

  const toggleSubCatFilter = useCallback((sc: SubCategory) => {
    setSelectedSubCats((prev) => {
      if (prev.some((x) => x.id === sc.id)) {
        return prev.filter((x) => x.id !== sc.id);
      }
      return [...prev, { type: 'TRADE', id: sc.id, name: sc.name }];
    });
  }, []);

  const removeFilterTag = useCallback((tag: FilterTag) => {
    if (tag.type === 'DIVISION') {
      setSelectedMainCats((prev) => prev.filter((x) => x.id !== tag.id));
    } else if (tag.type === 'CATEGORY') {
      setSelectedCats((prev) => prev.filter((x) => x.id !== tag.id));
    } else if (tag.type === 'TRADE') {
      setSelectedSubCats((prev) => prev.filter((x) => x.id !== tag.id));
    }
  }, []);

  const resetAllFilters = useCallback(() => {
    setSelectedMainCats([]);
    setSelectedCats([]);
    setSelectedSubCats([]);
    setSelectedScope('');
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'vendorId',
        label: 'Vendor ID',
        render: (row: any) => (
          <span className="font-mono text-xs text-slate-700 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
            {row.vendorCode || 'N/A'}
          </span>
        ),
      },
      {
        key: 'companyName',
        label: 'Vendor / Contact',
        render: (row: any) => (
          <div>
            <span className="font-bold text-slate-800 block">{row.companyName || row.ownerName}</span>
            <span className="text-xxs text-slate-400 font-medium">{row.phone}</span>
          </div>
        ),
      },
      {
        key: 'email',
        label: 'Company Email',
        render: (row: any) => (
          <span className="text-slate-500 font-semibold">{row.user?.email || 'N/A'}</span>
        ),
      },
      {
        key: 'businessCategory',
        label: 'Vendor Role',
        render: (row: any) => (
          <span className="text-slate-700 font-semibold">{row.businessCategory || 'N/A'}</span>
        ),
      },
      {
        key: 'vendorType',
        label: 'Type',
        render: (row: any) => (
          <span className="uppercase text-xxs font-bold text-slate-600">{row.vendorType}</span>
        ),
      },
      {
        key: 'scopeOfWork',
        label: 'Scope of Work',
        render: (row: any) => {
          const uniqueScopes = Array.from(
            new Set(row.services?.flatMap((svc: any) => svc.scopes) || [])
          );
          return (
            <div className="flex flex-wrap gap-1 max-w-[250px]">
              {uniqueScopes.map((scope: any) => (
                <span
                  key={scope}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100/50"
                >
                  {scope.replace(/_/g, ' ')}
                </span>
              ))}
              {uniqueScopes.length === 0 && (
                <span className="text-xxs text-slate-400 italic font-medium">None</span>
              )}
            </div>
          );
        },
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
        key: 'status',
        label: 'Status',
        render: (row: any) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold ${
              row.status === 'APPROVED'
                ? 'bg-green-50 text-green-700 border border-green-100/50'
                : row.status === 'PENDING'
                ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                : 'bg-red-50 text-red-700 border border-red-100/50'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: any) => (
          <div className="flex items-center gap-1.5">
            <Link
              to={`/admin/vendors/${row.id}`}
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors inline-block"
              title="View Complete Vendor Details"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleEditClick(row)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Edit Vendor Profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleEditClick]
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Contractors Database</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review onboarding progress, compliance details, and service offerings for all vendors
        </p>
      </div>

      {/* Filters Card */}
      <Card title="Database Filtering & Search" subtitle="Drill down contractors by trade and compliance status">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Search vendor email, company name, license..."
              value={searchTerm}
              onChange={handleSearchChange}
              icon={useMemo(() => <Search className="h-4 w-4" />, [])}
              disabled={isFilterActive}
            />
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
            <Select
              options={scopeOptions}
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              disabled={isSearchActive}
            />
          </div>

          {/* Dynamic Active Filters Basket */}
          {isFilterActive && (
            <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                  Active Filter Basket
                </span>
                <button
                  onClick={resetAllFilters}
                  className="text-xxs font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMainCats.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                  >
                    Division: {tag.name}
                    <button
                      onClick={() => removeFilterTag(tag)}
                      className="hover:text-emerald-950 cursor-pointer shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedCats.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-blue-50 text-blue-800 border border-blue-200/50"
                  >
                    Category: {tag.name}
                    <button
                      onClick={() => removeFilterTag(tag)}
                      className="hover:text-blue-950 cursor-pointer shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedSubCats.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/50"
                  >
                    Trade: {tag.name}
                    <button
                      onClick={() => removeFilterTag(tag)}
                      className="hover:text-indigo-950 cursor-pointer shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedScope && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-purple-50 text-purple-800 border border-purple-200/50">
                    Scope: {selectedScope.replace(/_/g, ' ')}
                    <button
                      onClick={() => setSelectedScope('')}
                      className="hover:text-purple-950 cursor-pointer shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3-Column Cascading Browser Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden min-h-[260px] bg-white shadow-xxs">
            {/* Column 1: Divisions */}
            <div className="border-r border-slate-200 bg-slate-50/50 flex flex-col">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-100/60 flex items-center justify-between">
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Divisions</span>
                {selectedMainCats.length > 0 && (
                  <button
                    onClick={() => setSelectedMainCats([])}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-650 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px]">
                {mainCategories.map((mc) => {
                  const isAdded = selectedMainCats.some((x) => x.id === mc.id);
                  return (
                    <div
                      key={mc.id}
                      onClick={() => setExpandedMainCat(mc.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-all border-b border-slate-100 cursor-pointer select-none ${
                        expandedMainCat === mc.id
                          ? 'bg-slate-100/70 text-slate-900 font-bold border-l-2 border-l-primary'
                          : 'text-slate-650 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        {mc.name}
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleMainCatFilter(mc)}
                          disabled={isSearchActive}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                            isAdded
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                          }`}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Categories */}
            <div className="border-r border-slate-200 bg-white flex flex-col">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-100/60 flex items-center justify-between">
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Categories</span>
                {selectedCats.length > 0 && (
                  <button
                    onClick={() => setSelectedCats([])}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-650 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px]">
                {!expandedMainCat ? (
                  <div className="flex items-center justify-center h-full p-4 text-center">
                    <span className="text-xxs text-slate-400 font-medium">← Select a division first</span>
                  </div>
                ) : (
                  categories.map((c) => {
                    const isAdded = selectedCats.some((x) => x.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => setExpandedCat(c.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-all border-b border-slate-100 cursor-pointer select-none ${
                          expandedCat === c.id
                            ? 'bg-slate-100/70 text-slate-900 font-bold border-l-2 border-l-primary'
                            : 'text-slate-650 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          {c.name}
                        </span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleCatFilter(c)}
                            disabled={isSearchActive}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                              isAdded
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                                : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                            }`}
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </button>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Trades */}
            <div className="bg-white flex flex-col">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-100/60 flex items-center justify-between">
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Trades</span>
                {selectedSubCats.length > 0 && (
                  <button
                    onClick={() => setSelectedSubCats([])}
                    className="text-[10px] font-bold text-slate-450 hover:text-slate-650 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px]">
                {!expandedCat ? (
                  <div className="flex items-center justify-center h-full p-4 text-center">
                    <span className="text-xxs text-slate-400 font-medium">← Select a category first</span>
                  </div>
                ) : (
                  subCategories.map((sc) => {
                    const isAdded = selectedSubCats.some((x) => x.id === sc.id);
                    return (
                      <div
                        key={sc.id}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left border-b border-slate-100 select-none"
                      >
                        <span className="font-medium text-slate-650">{sc.name}</span>
                        <button
                          onClick={() => toggleSubCatFilter(sc)}
                          disabled={isSearchActive}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer disabled:opacity-50 ${
                            isAdded
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100'
                              : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                          }`}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={filteredVendors}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyStateText="No registered contractors match the selected filter criteria."
        dense={true}
      />

      <EditVendorModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingVendor(null);
        }}
        vendor={editingVendor}
        onSave={async (data) => {
          if (editingVendor) {
            await editMutation.mutateAsync({ id: editingVendor.id, data });
          }
        }}
        isSaving={editMutation.isPending}
      />
    </div>
  );
};

export const VendorList = React.memo(VendorListComponent);
VendorList.displayName = 'VendorList';
export default VendorList;
