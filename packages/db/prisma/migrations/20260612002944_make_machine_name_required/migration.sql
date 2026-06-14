/*
  Warnings:

  - Made the column `machine_name` on table `machines` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "machines" ALTER COLUMN "machine_name" SET NOT NULL;
