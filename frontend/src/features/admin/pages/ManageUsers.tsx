import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Table } from '../../../components/Table/Table';
import { Card } from '../../../components/Card/Card';
import {
  Shield,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '../../../types';

const ManageUsersComponent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users query
  const { data: result, isLoading } = useQuery({
    queryKey: ['adminUsers', currentPage],
    queryFn: () => adminApi.listUsers({ page: currentPage, limit: 10 }),
  });

  const users = useMemo(() => result?.data || [], [result]);
  const totalPages = result?.pagination?.totalPages || 1;

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

      <Card className="overflow-hidden shadow-md border border-slate-100 rounded-2xl w-full">
        <Table
          columns={columns}
          data={users}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyStateText="No registered users found."
        />
      </Card>
    </div>
  );
};

export const ManageUsers = React.memo(ManageUsersComponent);
ManageUsers.displayName = 'ManageUsers';
export default ManageUsers;
