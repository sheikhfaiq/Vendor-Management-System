import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../../api/serviceApi';
import { Modal } from '../Modal/Modal';
import { Select } from '../Select/Select';
import { Button } from '../Button/Button';
import { Check } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subCategoryId: string, scopes: string[]) => Promise<void>;
  isAdding: boolean;
  existingSubCategoryIds?: string[];
}

const SCOPES = [
  { value: 'DESIGN_ENGINEERING', label: 'Design & Engineering' },
  { value: 'SUPPLY', label: 'Supply' },
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'TESTING_COMMISSIONING', label: 'Testing & Commissioning' },
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isAdding,
  existingSubCategoryIds = [],
}) => {
  const [selectedMainCat, setSelectedMainCat] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  // Fetch Main Categories
  const { data: mainCategories = [], isLoading: isLoadingMain } = useQuery({
    queryKey: ['mainCategories'],
    queryFn: serviceApi.getMainCategories,
    enabled: isOpen,
  });

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCat } = useQuery({
    queryKey: ['categories', selectedMainCat],
    queryFn: () => serviceApi.getCategories(selectedMainCat),
    enabled: isOpen && !!selectedMainCat,
  });

  // Fetch Sub Categories
  const { data: subCategories = [], isLoading: isLoadingSub } = useQuery({
    queryKey: ['subCategories', selectedCat],
    queryFn: () => serviceApi.getSubCategories(selectedCat),
    enabled: isOpen && !!selectedCat,
  });

  const availableSubCategories = useMemo(() => {
    return subCategories.filter((sub: any) => !existingSubCategoryIds.includes(sub.id));
  }, [subCategories, existingSubCategoryIds]);

  const handleScopeToggle = (scopeValue: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeValue)
        ? prev.filter((s) => s !== scopeValue)
        : [...prev, scopeValue]
    );
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubCat || selectedScopes.length === 0) return;
    await onAdd(selectedSubCat, selectedScopes);
    // Reset states
    setSelectedMainCat('');
    setSelectedCat('');
    setSelectedSubCat('');
    setSelectedScopes([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Service Trade & Scope"
      size="md"
    >
      <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-2">
        <Select
          label="Division / Sector"
          value={selectedMainCat}
          onChange={(e) => {
            setSelectedMainCat(e.target.value);
            setSelectedCat('');
            setSelectedSubCat('');
          }}
          options={[
            { value: '', label: isLoadingMain ? 'Loading divisions...' : 'Select Division' },
            ...mainCategories.map((m: any) => ({ value: m.id, label: m.name })),
          ]}
          disabled={isLoadingMain}
        />

        <Select
          label="Category"
          value={selectedCat}
          onChange={(e) => {
            setSelectedCat(e.target.value);
            setSelectedSubCat('');
          }}
          options={[
            { value: '', label: isLoadingCat ? 'Loading categories...' : 'Select Category' },
            ...categories.map((c: any) => ({ value: c.id, label: c.name })),
          ]}
          disabled={!selectedMainCat || isLoadingCat}
        />

        <Select
          label="Specific Trade"
          value={selectedSubCat}
          onChange={(e) => setSelectedSubCat(e.target.value)}
          options={[
            { value: '', label: isLoadingSub ? 'Loading trades...' : 'Select Trade' },
            ...availableSubCategories.map((s: any) => ({ value: s.id, label: s.name })),
          ]}
          disabled={!selectedCat || isLoadingSub}
        />

        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-xs font-semibold text-slate-650 uppercase tracking-wider">
            Scopes of Work *
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {SCOPES.map((scope) => {
              const isChecked = selectedScopes.includes(scope.value);
              return (
                <div
                  key={scope.value}
                  onClick={() => handleScopeToggle(scope.value)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-primary bg-primary/5 text-primary-dark font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-primary border-primary text-white' : 'border-slate-350'
                  }`}>
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs">{scope.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isAdding}
            disabled={!selectedSubCat || selectedScopes.length === 0}
          >
            Add Service
          </Button>
        </div>
      </form>
    </Modal>
  );
};
