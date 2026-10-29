CREATE SEQUENCE ticket_number_seq;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'DELIVERED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" UUID NOT NULL,
    "ticketNumber" TEXT NOT NULL DEFAULT ('RF-' || lpad(nextval('ticket_number_seq')::text, 6, '0')),
    "customerName" VARCHAR(120) NOT NULL,
    "customerPhone" VARCHAR(25) NOT NULL,
    "deviceName" VARCHAR(120) NOT NULL,
    "deviceType" VARCHAR(80) NOT NULL,
    "problemDescription" VARCHAR(3000) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "technicianId" UUID,
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(25),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" UUID NOT NULL,
    "partCode" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitPriceMinor" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_technicianId_idx" ON "Ticket"("technicianId");

-- CreateIndex
CREATE INDEX "Ticket_customerName_idx" ON "Ticket"("customerName");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partCode_key" ON "Part"("partCode");

-- CreateIndex
CREATE INDEX "Allocation_ticketId_idx" ON "Allocation"("ticketId");

-- CreateIndex
CREATE INDEX "Allocation_partId_idx" ON "Allocation"("partId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Part" ADD CONSTRAINT "Part_nonnegative" CHECK ("quantity" >= 0 AND "unitPriceMinor" >= 0 AND "lowStockThreshold" >= 0);
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_valid_quantity_price" CHECK ("quantity" > 0 AND "unitPriceMinor" >= 0);
