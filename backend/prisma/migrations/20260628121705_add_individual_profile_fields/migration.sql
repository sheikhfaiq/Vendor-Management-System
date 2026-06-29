-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "assetName" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "gosiCertificateNo" TEXT,
ADD COLUMN     "insurancePolicyNo" TEXT,
ADD COLUMN     "iqamaCompanyName" TEXT,
ADD COLUMN     "iqamaNumber" TEXT,
ADD COLUMN     "iqamaProfession" TEXT,
ADD COLUMN     "nationality" TEXT;
