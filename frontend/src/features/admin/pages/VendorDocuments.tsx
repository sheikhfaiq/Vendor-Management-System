import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/adminApi';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { Modal } from '../../../components/Modal/Modal';
import {
  FileText,
  ExternalLink,
  Download,
  Search,
  FolderOpen,
  Building2,
  Calendar,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const DOC_TYPE_COLORS: Record<string, string> = {
  'Trade License': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Tax Registration': 'bg-blue-50 text-blue-700 border-blue-200',
  'Certificate of Incorporation': 'bg-violet-50 text-violet-700 border-violet-200',
  'VAT Certificate': 'bg-amber-50 text-amber-700 border-amber-200',
  'Others': 'bg-slate-100 text-slate-600 border-slate-200',
};

const VendorDocumentsComponent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [docToVerify, setDocToVerify] = useState<string | null>(null);
  const [docNameToVerify, setDocNameToVerify] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const limit = 20;

  const { data: result, isLoading } = useQuery({
    queryKey: ['adminAllDocuments', currentPage],
    queryFn: () => adminApi.listAllDocuments({ page: currentPage, limit }),
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyDocument,
    onSuccess: () => {
      toastService.success('Document verified and local file deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminAllDocuments'] });
    },
    onError: (error: any) => {
      toastService.error(error.response?.data?.message || 'Failed to verify document.');
    },
  });

  const allDocs = useMemo(() => result?.data || [], [result]);
  const totalPages = result?.pagination?.totalPages || 1;
  const totalCount = result?.pagination?.total || 0;

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return allDocs;
    const q = searchQuery.toLowerCase();
    return allDocs.filter(
      (doc: any) =>
        doc.name?.toLowerCase().includes(q) ||
        doc.vendorProfile?.companyName?.toLowerCase().includes(q) ||
        doc.vendorProfile?.ownerName?.toLowerCase().includes(q) ||
        doc.vendorProfile?.user?.email?.toLowerCase().includes(q) ||
        doc.fileKey?.toLowerCase().includes(q)
    );
  }, [allDocs, searchQuery]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  const resolveUrl = (doc: any) => {
    const url = doc.fileUrl || '';
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  const cleanFileName = (fileKey: string) => {
    const base = fileKey.replace(/^documents\//, '');
    const prefixRegex = /^[a-f0-9-]{36}-\d{13}-[a-f0-9]{8}-/;
    return base.replace(prefixRegex, '');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const docTypeClass = (name: string) => {
    return DOC_TYPE_COLORS[name] || DOC_TYPE_COLORS['Others'];
  };

  return (
    <div className="min-h-full w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* ---- Page Header ---- */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Vendor Documents
            </h1>
            <p className="text-sm text-slate-450 font-medium mt-0.5">
              Compliance licenses, tax registrations, and certification files uploaded by contractors
            </p>
          </div>
        </div>
      </div>


      {/* ---- Search Bar ---- */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by document name, vendor company, email..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-350 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ---- Documents Table ---- */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-400">
            <div className="p-5 bg-slate-50 rounded-2xl">
              <FolderOpen className="h-12 w-12 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-500">No documents found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery ? 'Try adjusting your search query.' : 'No compliance documents have been uploaded yet.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-450 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Document</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Vendor / Company</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Uploaded</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc: any, idx: number) => {
                    const fileUrl = resolveUrl(doc);
                    const fileName = cleanFileName(doc.fileKey || '');
                    const isCompany = !!doc.vendorProfile?.companyName;

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-slate-350 font-mono font-semibold">
                          {(currentPage - 1) * limit + idx + 1}
                        </td>

                        {/* Document Name */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary/5 shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold text-slate-800 truncate max-w-[160px]">
                                {doc.name || 'Document'}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
                                Cert: {doc.documentNumber || 'N/A'}
                              </span>
                              {doc.fileKey !== 'verified_and_deleted' && (
                                <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                                  {fileName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${docTypeClass(doc.name)}`}
                          >
                            {doc.name || 'Others'}
                          </span>
                        </td>

                        {/* Vendor / Company */}
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="p-1 bg-slate-100 rounded-lg shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <span className="block font-semibold text-slate-700 truncate max-w-[140px]">
                                {isCompany
                                  ? doc.vendorProfile.companyName
                                  : doc.vendorProfile?.ownerName || 'N/A'}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {isCompany ? 'Corporate' : 'Individual'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <span className="text-slate-550 font-medium truncate block max-w-[160px]">
                            {doc.vendorProfile?.user?.email || 'N/A'}
                          </span>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-350" />
                            <span className="font-medium">{formatDate(doc.uploadedAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 justify-center">
                            {doc.fileKey === 'verified_and_deleted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-150/50 select-none">
                                <Check className="h-3.5 w-3.5 shrink-0" /> Verified (File Deleted)
                              </span>
                            ) : (
                              <>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors select-none"
                                  title="View Document"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> View
                                </a>
                                <a
                                  href={fileUrl}
                                  download={fileName}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-150 px-2.5 py-1.5 rounded-lg transition-colors select-none"
                                  title="Download Document"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download
                                </a>
                                <button
                                  onClick={() => {
                                    setDocToVerify(doc.id);
                                    setDocNameToVerify(doc.name);
                                    setIsConfirmOpen(true);
                                  }}
                                  disabled={verifyMutation.isPending}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors select-none cursor-pointer disabled:opacity-50"
                                  title="Verify and delete local file"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" /> Verify
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-slate-50/40">
                <span className="text-xs text-slate-450 font-medium">
                  Page {currentPage} of {totalPages} — {totalCount} total documents
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          page === currentPage
                            ? 'bg-primary text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDocToVerify(null);
          setDocNameToVerify(null);
        }}
        title="Confirm Document Verification"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              onClick={() => {
                setIsConfirmOpen(false);
                setDocToVerify(null);
                setDocNameToVerify(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-150 rounded-lg transition-colors cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (docToVerify) {
                  verifyMutation.mutate(docToVerify);
                  setIsConfirmOpen(false);
                  setDocToVerify(null);
                  setDocNameToVerify(null);
                }
              }}
              disabled={verifyMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer select-none disabled:opacity-50 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" /> Yes, Verify
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Verify {docNameToVerify || 'Document'}?
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to verify this document? The local certificate file will be **permanently deleted** from the disk to save server storage space. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const VendorDocuments = React.memo(VendorDocumentsComponent);
VendorDocuments.displayName = 'VendorDocuments';
export default VendorDocuments;
