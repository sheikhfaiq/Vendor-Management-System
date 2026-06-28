import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../../api/vendorApi';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Table } from '../../../components/Table/Table';
import { Select } from '../../../components/Select/Select';
import { Loader } from '../../../components/Loader/Loader';
import { toastService } from '../../../lib/notifications/toastService';
import { logger } from '../../../lib/utils/logger';
import { FileText, UploadCloud, Trash2, Eye, FileUp, CheckCircle2 } from 'lucide-react';
import type { VendorDocument } from '../../../types';

const DOCUMENT_TYPES = [
  { value: '', label: 'Select Document Type' },
  { value: 'Trade License', label: 'Commercial Registration (CR) / Trade License' },
  { value: 'VAT Registration', label: 'VAT Certificate (TRN)' },
  { value: 'Saudization Certificate', label: 'Saudization Certificate (MHRSD)' },
  { value: 'GOSI Certificate', label: 'GOSI Certificate' },
  { value: 'Chamber of Commerce', label: 'Chamber of Commerce Certificate' },
  { value: 'Zakat Certificate', label: 'Zakat Certificate (ZATCA)' },
  { value: 'Owner Identification', label: 'Owner / Contact ID (Iqama)' },
  { value: 'Company Profile', label: 'Company Profile / Brochure' },
  { value: 'Others', label: 'Other Document' },
];

const MyDocumentsComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery<VendorDocument[]>({
    queryKey: ['vendorDocuments'],
    queryFn: vendorApi.getDocuments,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: vendorApi.deleteDocument,
    onSuccess: () => {
      toastService.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || 'Failed to delete document';
      logger.error('Failed to delete document', error);
      toastService.error(errMsg);
    },
  });

  // Drag and drop / file selector handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docType) {
      toastService.warn('Please select a document type');
      return;
    }
    if (!selectedFile) {
      toastService.warn('Please choose a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Request pre-signed (or local mock) upload URL
      const { uploadUrl, fileKey, fileUrl } = await vendorApi.requestUploadUrl(
        selectedFile.name,
        selectedFile.type
      );

      const headers: Record<string, string> = {
        'Content-Type': selectedFile.type,
      };

      // In local development mock mode, we must include the Auth token to pass route authentication
      if (uploadUrl.includes('/vendors/documents/local-upload-mock')) {
        const token = sessionStorage.getItem('vms_access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Step 2: Directly upload file to S3 or local mock backend
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage server');
      }

      // Step 3: Confirm upload details in backend database
      await vendorApi.confirmUpload({
        name: docType,
        fileKey,
        fileUrl,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      });

      toastService.success(`${docType} uploaded successfully`);
      setDocType('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
    } catch (error: any) {
      logger.error('Document upload failed', error);
      toastService.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Document Type',
        render: (row: VendorDocument) => (
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/5 rounded-lg text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{row.name}</span>
          </div>
        ),
      },
      {
        key: 'fileName',
        label: 'Filename',
        render: (row: VendorDocument) => {
          const baseName = row.fileKey.replace(/^documents\//, '');
          const prefixRegex = /^[a-f0-9-]{36}-\d{13}-[a-f0-9]{8}-/;
          const cleanName = baseName.replace(prefixRegex, '');
          return <span className="text-slate-500 font-medium text-xs truncate max-w-[200px] inline-block">{cleanName}</span>;
        },
      },
      {
        key: 'fileSize',
        label: 'Size',
        render: (row: VendorDocument) => (
          <span className="text-slate-500 text-xs font-medium">{formatBytes(row.fileSize)}</span>
        ),
      },
      {
        key: 'uploadedAt',
        label: 'Uploaded Date',
        render: (row: VendorDocument) => (
          <span className="text-slate-400 text-xs">{new Date(row.uploadedAt).toLocaleDateString()}</span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row: VendorDocument) => (
          <div className="flex items-center gap-2">
            <a
              href={row.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              title="View / Download Document"
            >
              <Eye className="h-4 w-4" />
            </a>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Documents</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload and manage compliance documents, trade licenses, and certificates for validation in Saudi Arabia
        </p>
      </div>

      {/* Upload Document Card (Full Width) */}
      <Card
        title="Upload Document"
        subtitle="Upload trade licenses, commercial registrations, or tax certificates (Max 10MB)"
        className="w-full shadow-md border border-slate-100 rounded-2xl"
      >
        <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end w-full">
          <Select
            label="Document Type *"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            options={DOCUMENT_TYPES}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              File Attachment *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-4 py-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2 h-[42px] ${
                selectedFile
                  ? 'border-emerald-350 bg-emerald-50/30 border-emerald-400 text-emerald-800'
                  : 'border-slate-200 hover:border-primary hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
              />
              {selectedFile ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold truncate max-w-[180px]">
                    {selectedFile.name}
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-500">Choose file or drag here</span>
                </>
              )}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isUploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-sm font-semibold select-none h-[42px]"
          >
            <FileUp className="h-4 w-4" /> Upload Document
          </Button>
        </form>
      </Card>

      {/* Compliance Document List Card (Full Width) */}
      <Card
        title="Compliance Document List"
        subtitle="Approved files are kept securely in our databases"
        className="w-full shadow-md border border-slate-100 rounded-2xl"
      >
        {isLoadingDocs ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : (
          <Table
            columns={columns}
            data={documents}
            emptyStateText="No compliance documents uploaded yet. Upload a file above to start."
          />
        )}
      </Card>
    </div>
  );
};

export const MyDocuments = React.memo(MyDocumentsComponent);
MyDocuments.displayName = 'MyDocuments';
export default MyDocuments;
