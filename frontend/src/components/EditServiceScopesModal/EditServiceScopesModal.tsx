import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Check } from 'lucide-react';

interface EditServiceScopesModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any | null;
  onSave: (serviceId: string, scopes: string[]) => Promise<void>;
  isSaving: boolean;
}

const SCOPES = [
  { value: 'DESIGN_ENGINEERING', label: 'Design & Engineering' },
  { value: 'SUPPLY', label: 'Supply' },
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'TESTING_COMMISSIONING', label: 'Testing & Commissioning' },
];

export const EditServiceScopesModal: React.FC<EditServiceScopesModalProps> = ({
  isOpen,
  onClose,
  service,
  onSave,
  isSaving,
}) => {
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  useEffect(() => {
    if (service) {
      setSelectedScopes(service.scopes || []);
    }
  }, [service]);

  const handleScopeToggle = (scopeValue: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeValue)
        ? prev.filter((s) => s !== scopeValue)
        : [...prev, scopeValue]
    );
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || selectedScopes.length === 0) return;
    await onSave(service.id, selectedScopes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Service Scopes`}
      size="md"
    >
      <form onSubmit={handleSaveSubmit} className="flex flex-col gap-4 py-2">
        <div>
          <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">
            Selected Service
          </span>
          <span className="text-sm font-bold text-slate-800">
            {service?.subCategory?.name || 'N/A'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-650 uppercase tracking-wider">
            Active Scopes of Work *
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={selectedScopes.length === 0}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
