import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Table } from '../../../components/Table/Table';
import { Loader } from '../../../components/Loader/Loader';
import { Calendar, Monitor, Globe } from 'lucide-react';

const ActivityLogsComponent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: result, isLoading } = useQuery({
    queryKey: ['adminActivityLogs', currentPage],
    queryFn: () => adminApi.listActivityLogs({ page: currentPage, limit: 10 }),
  });

  const logs = useMemo(() => result?.data || [], [result]);
  const totalPages = result?.pagination?.totalPages || 1;

  const columns = useMemo(
    () => [
      {
        key: 'action',
        label: 'Audit Action',
        render: (row: any) => (
          <div>
            <span className="font-bold text-slate-800 block uppercase tracking-wider text-xxs bg-slate-100/70 border border-slate-150 px-2 py-0.5 rounded-md w-max">
              {row.action}
            </span>
            <span className="text-xs text-slate-500 font-semibold block mt-1.5 leading-relaxed break-words whitespace-normal max-w-sm">
              {row.details}
            </span>
          </div>
        ),
      },
      {
        key: 'user',
        label: 'Actor / Admin',
        render: (row: any) => (
          <div>
            <span className="font-bold text-slate-700 block text-xs">{row.user?.email || 'System / Public'}</span>
            <span className="text-xxs text-slate-400 font-semibold font-mono">{row.userId || 'N/A'}</span>
          </div>
        ),
      },
      {
        key: 'metadata',
        label: 'Client Metadata',
        render: (row: any) => (
          <div className="flex flex-col gap-1 text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 text-xxs">
              <Globe className="h-3.5 w-3.5" />
              <span>IP: {row.ipAddress || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xxs truncate max-w-xs">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={row.userAgent}>
                {row.userAgent || 'Unknown'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Timestamp',
        render: (row: any) => (
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Compliance Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          History log of critical actions, credential changes, and onboarding events across the application
        </p>
      </div>

      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyStateText="No compliance activity records found."
      />
    </div>
  );
};

export const ActivityLogs = React.memo(ActivityLogsComponent);
ActivityLogs.displayName = 'ActivityLogs';
export default ActivityLogs;
