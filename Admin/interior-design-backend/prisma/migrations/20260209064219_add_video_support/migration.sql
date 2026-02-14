/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `ProjectEntry` table. All the data in the column will be lost.
  - Added the required column `fileUrl` to the `ProjectEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "ProjectEntry" DROP COLUMN "imageUrl",
ADD COLUMN     "fileType" "FileType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "fileUrl" TEXT NOT NULL;
