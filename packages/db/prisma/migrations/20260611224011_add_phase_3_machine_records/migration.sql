-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "external_ref" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_models" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model_code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "machine_model_id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "name" TEXT,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "installed_at" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_name_key" ON "customers"("organization_id", "name");

-- CreateIndex
CREATE INDEX "machine_models_organization_id_idx" ON "machine_models"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "machine_models_organization_id_manufacturer_name_key" ON "machine_models"("organization_id", "manufacturer", "name");

-- CreateIndex
CREATE INDEX "machines_organization_id_status_idx" ON "machines"("organization_id", "status");

-- CreateIndex
CREATE INDEX "machines_organization_id_customer_id_idx" ON "machines"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "machines_organization_id_machine_model_id_idx" ON "machines"("organization_id", "machine_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "machines_organization_id_serial_number_key" ON "machines"("organization_id", "serial_number");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_models" ADD CONSTRAINT "machine_models_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_machine_model_id_fkey" FOREIGN KEY ("machine_model_id") REFERENCES "machine_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
