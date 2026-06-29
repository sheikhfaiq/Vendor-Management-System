import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Button } from '../../../components/Button/Button';
import { Loader } from '../../../components/Loader/Loader';
import { Table } from '../../../components/Table/Table';
import { Modal } from '../../../components/Modal/Modal';
import { Input } from '../../../components/Input/Input';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Mail,
  Phone,
  User,
  IdCard,
  Briefcase,
  Calendar,
  Heart,
  FileText,
  FileCheck,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const MyTeam: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Modal & Edit State
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'identity' | 'compliance'>('basic');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [assetName, setAssetName] = useState('');
  const [iqamaNumber, setIqamaNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gosiCertificateNo, setGosiCertificateNo] = useState('');
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('');
  const [iqamaProfession, setIqamaProfession] = useState('');
  const [iqamaCompanyName, setIqamaCompanyName] = useState('');

  // Fetch Vendor Profile (to check locked state & type)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
  });

  // Fetch Team Members
  const { data: team = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['vendorTeam'],
    queryFn: vendorApi.getTeamMembers,
    enabled: profile?.vendorType === 'COMPANY',
  });

  const isLocked = !profile || (profile.isSubmitted && profile.status !== 'APPROVED');

  // Mutation to Add/Update Team Member
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingMember) {
        return vendorApi.updateTeamMember(editingMember.id, data);
      }
      return vendorApi.addTeamMember(data);
    },
    onSuccess: () => {
      toastService.success(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorTeam'] });
      handleClose();
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to save team member';
      logger.error('Failed to save team member', error);
      toastService.error(errMsg);
    },
  });

  // Mutation to Delete Team Member
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteTeamMember(id),
    onSuccess: () => {
      toastService.success('Team member deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendorTeam'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete team member';
      logger.error('Failed to delete team member', error);
      toastService.error(errMsg);
    },
  });

  // Handlers
  const handleOpenAdd = () => {
    setEditingMember(null);
    setActiveTab('basic');
    
    // Reset Form Fields
    setName('');
    setPhone('');
    setEmail('');
    setAssetName('');
    setIqamaNumber('');
    setExpiryDate('');
    setNationality('');
    setBloodGroup('');
    setGosiCertificateNo('');
    setInsurancePolicyNo('');
    setIqamaProfession('');
    setIqamaCompanyName('');
    
    setIsOpen(true);
  };

  const handleOpenEdit = (member: any) => {
    setEditingMember(member);
    setActiveTab('basic');
    
    // Populating Form Fields
    setName(member.name || '');
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setAssetName(member.assetName || '');
    setIqamaNumber(member.iqamaNumber || '');
    setExpiryDate(member.expiryDate ? new Date(member.expiryDate).toISOString().split('T')[0] : '');
    setNationality(member.nationality || '');
    setBloodGroup(member.bloodGroup || '');
    setGosiCertificateNo(member.gosiCertificateNo || '');
    setInsurancePolicyNo(member.insurancePolicyNo || '');
    setIqamaProfession(member.iqamaProfession || '');
    setIqamaCompanyName(member.iqamaCompanyName || '');
    
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingMember(null);
  };

  const handleDelete = (member: any) => {
    if (window.confirm(`Are you sure you want to remove team member "${member.name}"?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastService.error('Name is required');
      return;
    }
    if (!phone.trim()) {
      toastService.error('Phone number is required');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      assetName: assetName.trim() || undefined,
      iqamaNumber: iqamaNumber.trim() || undefined,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      nationality: nationality.trim() || undefined,
      bloodGroup: bloodGroup.trim() || undefined,
      gosiCertificateNo: gosiCertificateNo.trim() || undefined,
      insurancePolicyNo: insurancePolicyNo.trim() || undefined,
      iqamaProfession: iqamaProfession.trim() || undefined,
      iqamaCompanyName: iqamaCompanyName.trim() || undefined,
    });
  };

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Team Member',
        render: (row: any) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-xs">{row.name}</span>
            {row.email && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {row.email}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'contact',
        label: 'Contact / Nationality',
        render: (row: any) => (
          <div className="flex flex-col">
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400" /> {row.phone}
            </span>
            {row.nationality && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                Nationality: {row.nationality}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'profession',
        label: 'Iqama Details',
        render: (row: any) => (
          <div className="flex flex-col text-slate-600 text-xs">
            {row.iqamaNumber ? (
              <>
                <span className="font-semibold text-slate-700">ID: {row.iqamaNumber}</span>
                {row.iqamaProfession && (
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Profession: {row.iqamaProfession}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400 italic">No Iqama details</span>
            )}
          </div>
        ),
      },
      {
        key: 'compliance',
        label: 'Certificates',
        render: (row: any) => (
          <div className="flex flex-wrap gap-1">
            {row.gosiCertificateNo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                GOSI
              </span>
            )}
            {row.insurancePolicyNo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-100">
                Insurance
              </span>
            )}
            {!row.gosiCertificateNo && !row.insurancePolicyNo && (
              <span className="text-slate-400 italic text-[11px]">None added</span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: any) => (
          <div className="flex items-center gap-1.5">
            {!isLocked ? (
              <>
                <button
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                  title="Edit Team Member"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove Team Member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1 px-1.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                <Lock className="h-3 w-3 text-slate-400" /> Locked
              </span>
            )}
          </div>
        ),
      },
    ],
    [isLocked]
  );

  if (isLoadingProfile || isLoadingTeam) return <Loader />;

  if (profile?.vendorType !== 'COMPANY') {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
        <Lock className="h-5 w-5 text-red-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-red-800">Access Denied</p>
          <p className="text-xxs text-red-650 mt-0.5">
            Team Member Management is restricted to Corporate/Company accounts only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Corporate Team Members
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add and manage profiles of workers or staff employed by your company.
          </p>
        </div>
        {!isLocked ? (
          <Button onClick={handleOpenAdd} className="flex items-center gap-1.5 shrink-0 select-none">
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-100/50 p-2.5 rounded-xl select-none">
            <Lock className="h-4 w-4" /> Team Locked
          </div>
        )}
      </div>

      {isLocked && (
        <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800">Compliance Verification Pending</p>
            <p className="text-xxs text-amber-600 mt-0.5 leading-relaxed">
              Your company profile is under compliance review. Editing team members is temporarily locked.
            </p>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={team}
        isLoading={isLoadingTeam}
        emptyStateText="No team members added yet. Click 'Add Team Member' to register your staff."
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
        footer={
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2 w-full">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={saveMutation.isPending} disabled={!name.trim() || !phone.trim()}>
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 w-full min-w-[320px] max-w-[640px]">
          {/* Tabs for Category organization */}
          <div className="flex border-b border-slate-100 font-sans">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'basic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'identity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Identity & Job
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'compliance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Compliance & Insurance
            </button>
          </div>

          {/* Form tab contents */}
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-3.5 mt-2 animate-fadeIn">
              <Input
                label="Full Name *"
                placeholder="Enter worker's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="h-4 w-4" />}
                required
              />
              <Input
                label="Phone Number *"
                placeholder="e.g. +966500000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="h-4 w-4" />}
                required
              />
              <Input
                label="Email Address"
                placeholder="e.g. employee@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nationality"
                  placeholder="e.g. Saudi"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
                <Input
                  label="Blood Group"
                  placeholder="e.g. O+"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  icon={<Heart className="h-4 w-4 text-red-500" />}
                />
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="flex flex-col gap-3.5 mt-2 animate-fadeIn">
              <Input
                label="Iqama / ID Number"
                placeholder="Enter 10-digit Iqama or ID"
                value={iqamaNumber}
                onChange={(e) => setIqamaNumber(e.target.value)}
                icon={<IdCard className="h-4 w-4" />}
              />
              <Input
                label="Iqama Expiry Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <Input
                label="Iqama Profession"
                placeholder="e.g. Electrical Engineer"
                value={iqamaProfession}
                onChange={(e) => setIqamaProfession(e.target.value)}
                icon={<Briefcase className="h-4 w-4" />}
              />
              <Input
                label="Iqama Company Name"
                placeholder="Current sponsor listed on Iqama"
                value={iqamaCompanyName}
                onChange={(e) => setIqamaCompanyName(e.target.value)}
                icon={<Building className="h-4 w-4" />}
              />
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="flex flex-col gap-3.5 mt-2 animate-fadeIn">
              <Input
                label="GOSI Certificate Number"
                placeholder="Enter social insurance registration number"
                value={gosiCertificateNo}
                onChange={(e) => setGosiCertificateNo(e.target.value)}
                icon={<FileCheck className="h-4 w-4" />}
              />
              <Input
                label="Insurance Policy Number"
                placeholder="Enter health/accident insurance policy number"
                value={insurancePolicyNo}
                onChange={(e) => setInsurancePolicyNo(e.target.value)}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <Input
                label="Asset/Sponsor Name"
                placeholder="Internal asset identifier or code"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                icon={<FileText className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyTeam;
