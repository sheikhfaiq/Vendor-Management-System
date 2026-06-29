import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Button } from '../../../components/Button/Button';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { FileText, UploadCloud, Trash2, Eye, FileUp, CheckCircle2, Lock } from 'lucide-react';
import type { VendorDocument } from '../../../types';

const REQUIRED_DOCUMENTS = [
  { value: 'Trade License', label: 'Commercial Registration (CR) / Trade License', placeholderNumber: 'CR / Trade License Number' },
  { value: 'VAT Registration', label: 'VAT Certificate (TRN)', placeholderNumber: 'VAT Registration Number (TRN)' },
  { value: 'Saudization Certificate', label: 'Saudization Certificate (MHRSD)', placeholderNumber: 'Saudization Number' },
  { value: 'GOSI Certificate', label: 'GOSI Certificate', placeholderNumber: 'GOSI Certificate Number' },
  { value: 'Chamber of Commerce', label: 'Chamber of Commerce Certificate', placeholderNumber: 'Chamber Number' },
  { value: 'Zakat Certificate', label: 'Zakat Certificate (ZATCA)', placeholderNumber: 'Zakat Number (ZATCA)' },
];

const MyDocumentsComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Individual document upload form states
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  // Queries
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery<VendorDocument[]>({
    queryKey: ['vendorDocuments'],
    queryFn: vendorApi.getDocuments,
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
  });

  const isLocked = !profile || profile.status !== 'APPROVED';

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: vendorApi.deleteDocument,
    onSuccess: () => {
      toastService.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete document';
      logger.error('Failed to delete document', error);
      toastService.error(errMsg);
    },
  });

  // State changes handlers
  const handleDocNumberChange = (docType: string, value: string) => {
    setDocNumbers((prev) => ({ ...prev, [docType]: value }));
  };

  const handleFileChangeForType = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
    }
  };

  const handleSingleUpload = async (docType: string) => {
    const file = selectedFiles[docType];
    const docNum = docNumbers[docType];

    if (!file) {
      toastService.warn('Please choose a file to upload');
      return;
    }
    if (!docNum || !docNum.trim()) {
      toastService.warn('Please enter the document number');
      return;
    }

    setUploadingState((prev) => ({ ...prev, [docType]: true }));
    try {
      // Step 1: Request pre-signed (or local mock) upload URL
      const { uploadUrl, fileKey, fileUrl } = await vendorApi.requestUploadUrl(
        file.name,
        file.type
      );

      const headers: Record<string, string> = {
        'Content-Type': file.type,
      };

      // In local development mock mode, we must include the Auth token to pass route authentication
      if (uploadUrl.includes('/vendors/documents/local-upload-mock')) {
        const token = sessionStorage.getItem('vms_access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Step 2: Directly upload file to storage backend
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage server');
      }

      // Step 3: Confirm upload details in backend database
      await vendorApi.confirmUpload({
        name: docType,
        documentNumber: docNum.trim(),
        fileKey,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      });

      toastService.success(`${docType} uploaded successfully`);

      // Clear local states for this type
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });
      setDocNumbers((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });
      const fileInput = fileInputRefs.current[docType];
      if (fileInput) {
        fileInput.value = '';
      }

      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDashboard'] });
    } catch (error: any) {
      logger.error('Document upload failed', error);
      toastService.error(error.message || 'Failed to upload document');
    } finally {
      setUploadingState((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Are you sure you want to delete this document?')) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation]
  );

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean filename helper
  const cleanFilename = (fileKey: string) => {
    const baseName = fileKey.replace(/^documents\//, '');
    const prefixRegex = /^[a-f0-9-]{36}-\d{13}-[a-f0-9]{8}-/;
    return baseName.replace(prefixRegex, '');
  };

  if (isLoadingDocs || isLoadingProfile) return <Loader />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compliance Documents</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload and manage the 6 required compliance documents for verification in Saudi Arabia
          </p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-100/50 p-2.5 rounded-xl select-none shadow-xs">
            <Lock className="h-4 w-4 shrink-0" /> Documents Locked
          </div>
        )}
      </div>

      {/* Redesigned 2x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {REQUIRED_DOCUMENTS.map((item) => {
          const doc = documents.find((d) => d.name === item.value);

          if (doc) {
            // Uploaded Document View
            return (
              <div
                key={item.value}
                className="flex flex-col h-full justify-between p-5 border border-emerald-250 bg-emerald-50/15 rounded-2xl shadow-xs transition-all hover:shadow-md border-emerald-400/30"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-xs">
                      <FileText className="h-5 w-5 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{item.label}</h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full select-none mt-1 inline-block">
                        Uploaded & Active
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/80 border border-emerald-100/50 rounded-xl p-3.5 flex flex-col gap-2 text-xxs font-medium text-slate-500 mt-1.5 shadow-xxs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Document No:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{doc.documentNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="text-slate-400">File Name:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[200px]" title={cleanFilename(doc.fileKey)}>
                        {cleanFilename(doc.fileKey)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="text-slate-400">File Size:</span>
                      <span className="font-bold text-slate-700">{formatBytes(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-slate-100/50">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-xxs"
                  >
                    <Eye className="h-4 w-4" /> View
                  </a>
                  {!isLocked && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/50 transition-all"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          } else {
            // Upload Form / Slot View
            return (
              <div
                key={item.value}
                className="flex flex-col h-full justify-between p-5 border border-slate-200 bg-white rounded-2xl shadow-xs transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
                      <FileText className="h-5 w-5 shrink-0" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 leading-snug">{item.label}</h4>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-1.5">
                    {/* Document Number Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Document ID Number *
                      </label>
                      <input
                        type="text"
                        placeholder={item.placeholderNumber}
                        value={docNumbers[item.value] || ''}
                        onChange={(e) => handleDocNumberChange(item.value, e.target.value)}
                        disabled={isLocked}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/20 focus:outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    {/* Drag / File selector box */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Upload Document File *
                      </label>
                      <div
                        onClick={() => {
                          if (!isLocked) fileInputRefs.current[item.value]?.click();
                        }}
                        className={`border border-dashed rounded-xl px-3 py-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2 min-h-[42px] ${
                          selectedFiles[item.value]
                            ? 'border-emerald-450 bg-emerald-50/20 border-emerald-400 text-emerald-800'
                            : 'border-slate-200 hover:border-primary hover:bg-slate-50/50'
                        }`}
                      >
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[item.value] = el;
                          }}
                          onChange={(e) => handleFileChangeForType(item.value, e)}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={isLocked}
                        />
                        {selectedFiles[item.value] ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xxs font-bold truncate max-w-[150px]">
                              {selectedFiles[item.value].name}
                            </span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-500">Choose File</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100/50">
                  {!isLocked ? (
                    <Button
                      onClick={() => handleSingleUpload(item.value)}
                      isLoading={uploadingState[item.value]}
                      disabled={!selectedFiles[item.value] || !docNumbers[item.value]?.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl"
                    >
                      <FileUp className="h-4 w-4" /> Upload Certificate
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xxs font-bold bg-slate-50 border border-slate-100 p-2.5 rounded-xl select-none">
                      <Lock className="h-4 w-4 shrink-0" /> Document Locked
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export const MyDocuments = React.memo(MyDocumentsComponent);
MyDocuments.displayName = 'MyDocuments';
export default MyDocuments;
