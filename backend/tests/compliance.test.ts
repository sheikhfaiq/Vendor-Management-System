import { VendorService } from '../src/modules/vendor/vendor.service';
import { vendorRepository } from '../src/modules/vendor/vendor.repository';
import { serviceRepository } from '../src/modules/service/service.repository';
import { AppError } from '../src/middleware/error.middleware';

jest.mock('../src/modules/vendor/vendor.repository');
jest.mock('../src/modules/service/service.repository');
jest.mock('../src/modules/auth/auth.repository');
jest.mock('../src/modules/notification/notification.service');

describe('Individual Vendor Compliance Rules', () => {
  let vendorService: VendorService;

  beforeEach(() => {
    jest.clearAllMocks();
    vendorService = new VendorService();
  });

  describe('addService compliance rules', () => {
    it('should throw an error if profile is not 100% complete', async () => {
      const mockProfile = { id: 'v-123', profileCompletion: 80, status: 'APPROVED' };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['INSTALLATION'])
      ).rejects.toThrow(new AppError('Your profile must be 100% complete before registering services.', 403));
    });

    it('should throw an error if profile status is not APPROVED', async () => {
      const mockProfile = { id: 'v-123', profileCompletion: 100, status: 'PENDING' };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['INSTALLATION'])
      ).rejects.toThrow(new AppError('Your profile must be approved by an administrator before registering services.', 403));
    });

    it('should block individual vendors from registering more than 2 services', async () => {
      const mockProfile = {
        id: 'v-123',
        profileCompletion: 100,
        status: 'APPROVED',
        vendorType: 'INDIVIDUAL',
        businessCategory: 'Labour',
      };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);
      (serviceRepository.findSubCategoryById as jest.Mock).mockResolvedValue({
        id: 'sub-123',
        name: 'Painting',
        category: { mainCategory: { name: 'Finishing Works (Civil Scope)' } },
      });
      (vendorRepository.countServicesByVendorId as jest.Mock).mockResolvedValue(2);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['INSTALLATION'])
      ).rejects.toThrow(
        new AppError(
          'Individual accounts are limited to registering a maximum of 2 trades. Contact support to upgrade your account to corporate.',
          403
        )
      );
    });

    it('should block individual Labour vendors from registering MEP main category services', async () => {
      const mockProfile = {
        id: 'v-123',
        profileCompletion: 100,
        status: 'APPROVED',
        vendorType: 'INDIVIDUAL',
        businessCategory: 'Labour',
      };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);
      (serviceRepository.findSubCategoryById as jest.Mock).mockResolvedValue({
        id: 'sub-123',
        name: 'Plumbing Works',
        category: { mainCategory: { name: 'MEP' } },
      });
      (vendorRepository.countServicesByVendorId as jest.Mock).mockResolvedValue(0);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['INSTALLATION'])
      ).rejects.toThrow(
        new AppError(
          'Your Vendor Role (Labour) is restricted from registering services in the "MEP" division.',
          403
        )
      );
    });

    it('should allow individual Labour vendors to register Finishing Works main category services', async () => {
      const mockProfile = {
        id: 'v-123',
        profileCompletion: 100,
        status: 'APPROVED',
        vendorType: 'INDIVIDUAL',
        businessCategory: 'Labour',
      };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);
      (serviceRepository.findSubCategoryById as jest.Mock).mockResolvedValue({
        id: 'sub-123',
        name: 'Tiling',
        category: { mainCategory: { name: 'Finishing Works (Civil Scope)' } },
      });
      (vendorRepository.countServicesByVendorId as jest.Mock).mockResolvedValue(0);
      (vendorRepository.findVendorServiceByMapping as jest.Mock).mockResolvedValue(null);
      (vendorRepository.addService as jest.Mock).mockResolvedValue({ id: 'mapping-123' });

      const result = await vendorService.addService('user-123', 'sub-123', ['INSTALLATION']);
      expect(result).toBeDefined();
    });

    it('should block individual Labour vendors from choosing SUPPLY or DESIGN_ENGINEERING scopes', async () => {
      const mockProfile = {
        id: 'v-123',
        profileCompletion: 100,
        status: 'APPROVED',
        vendorType: 'INDIVIDUAL',
        businessCategory: 'Labour',
      };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);
      (serviceRepository.findSubCategoryById as jest.Mock).mockResolvedValue({
        id: 'sub-123',
        name: 'Tiling',
        category: { mainCategory: { name: 'Finishing Works (Civil Scope)' } },
      });
      (vendorRepository.countServicesByVendorId as jest.Mock).mockResolvedValue(0);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['SUPPLY', 'INSTALLATION'])
      ).rejects.toThrow(
        new AppError(
          'Your Vendor Role (Labour) is not permitted to register the following scopes: SUPPLY.',
          403
        )
      );
    });

    it('should allow individual Technician vendors to choose INSTALLATION and TESTING_COMMISSIONING scopes but not SUPPLY', async () => {
      const mockProfile = {
        id: 'v-123',
        profileCompletion: 100,
        status: 'APPROVED',
        vendorType: 'INDIVIDUAL',
        businessCategory: 'Technician',
      };
      (vendorRepository.getProfileByUserId as jest.Mock).mockResolvedValue(mockProfile);
      (serviceRepository.findSubCategoryById as jest.Mock).mockResolvedValue({
        id: 'sub-123',
        name: 'Wiring',
        category: { mainCategory: { name: 'MEP' } },
      });
      (vendorRepository.countServicesByVendorId as jest.Mock).mockResolvedValue(0);

      await expect(
        vendorService.addService('user-123', 'sub-123', ['SUPPLY', 'INSTALLATION'])
      ).rejects.toThrow(
        new AppError(
          'Your Vendor Role (Technician) is not permitted to register the following scopes: SUPPLY.',
          403
        )
      );
    });
  });
});
