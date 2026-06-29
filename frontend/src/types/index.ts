export type Role = 'ADMIN' | 'VENDOR';
export type VendorType = 'INDIVIDUAL' | 'COMPANY';
export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ScopeOfWork =
  | 'DESIGN_ENGINEERING'
  | 'SUPPLY'
  | 'INSTALLATION'
  | 'TESTING_COMMISSIONING';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  vendorProfile?: VendorProfile | null;
}

export interface VendorProfile {
  id: string;
  userId: string;
  vendorType: VendorType;
  companyName: string | null;
  tradeLicenseNo: string | null;
  taxRegistrationNo: string | null;
  ownerName: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  businessCategory: string | null;
  status: VendorStatus;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
  services?: VendorService[];
  user?: {
    email: string;
    role: string;
  };
  documents?: VendorDocument[];

  // Custom Individual Vendor fields
  assetName: string | null;
  iqamaNumber: string | null;
  expiryDate: string | null;
  nationality: string | null;
  bloodGroup: string | null;
  gosiCertificateNo: string | null;
  insurancePolicyNo: string | null;
  iqamaProfession: string | null;
  iqamaCompanyName: string | null;
}

export interface MainCategory {
  id: string;
  name: string;
  categories?: Category[];
}

export interface Category {
  id: string;
  name: string;
  mainCategoryId: string;
  mainCategory?: MainCategory;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
}

export interface VendorService {
  id: string;
  vendorProfileId: string;
  subCategoryId: string;
  subCategory: SubCategory;
  scopes: ScopeOfWork[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  user?: User | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface VendorDocument {
  id: string;
  vendorProfileId: string;
  name: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  userId?: string | null;
  role?: 'ADMIN' | 'VENDOR' | null;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

