-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('TIMELINE', 'AGREEMENT', 'PAYMENT_INVOICE', 'HANDOVER', 'CERTIFICATE');

-- AlterEnum
ALTER TYPE "FileType" ADD VALUE 'PDF';

-- AlterTable
ALTER TABLE "ProjectEntry" ADD COLUMN     "category" "EntryCategory" NOT NULL DEFAULT 'TIMELINE';
