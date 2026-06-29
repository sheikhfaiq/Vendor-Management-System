-- AlterTable
ALTER TABLE "VendorDocument" ADD COLUMN     "documentNumber" TEXT;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false;
