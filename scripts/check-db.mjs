import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rollback = new Error("Intentional rollback after verification");
try {
  await db.$queryRaw`SELECT 1`;
  try {
    await db.$transaction(async (tx) => {
      const tech = await tx.technician.create({ data: { name: "Foundation verification" } });
      const ticketData = { customerName: "Verification", customerPhone: "9000000000", deviceName: "Phone", deviceType: "Phone", problemDescription: "Verification only", technicianId: tech.id };
      const first = await tx.ticket.create({ data: ticketData });
      const second = await tx.ticket.create({ data: ticketData });
      assert.match(first.ticketNumber, /^RF-\d{6,}$/);
      assert.notEqual(first.ticketNumber, second.ticketNumber);
      assert.equal(first.status, "NEW");
      assert.equal(first.priority, "MEDIUM");
      const part = await tx.part.create({ data: { partCode: "VERIFY-" + first.id, name: "Verification display", quantity: 2, unitPriceMinor: 100, lowStockThreshold: 2 } });
      const allocation = await tx.allocation.create({ data: { ticketId: first.id, partId: part.id, quantity: 1, unitPriceMinor: part.unitPriceMinor } });
      assert.equal(allocation.ticketId, first.id);
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  const checks = await db.$queryRaw`SELECT conname FROM pg_constraint WHERE conname IN ('Part_nonnegative', 'Allocation_valid_quantity_price')`;
  assert.equal(checks.length, 2);
  console.log("PASS: connection, schema, UUID relations, unique ticket numbers, defaults, and database constraints.");
  console.log("Verification records rolled back; sequence gaps are normal.");
} finally { await db.$disconnect(); }
