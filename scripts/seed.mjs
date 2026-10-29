import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env first.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await db.$transaction(async (tx) => {
    const technician = await tx.technician.upsert({
      where: { id: "11111111-1111-4111-8111-111111111111" },
      update: {},
      create: { id: "11111111-1111-4111-8111-111111111111", name: "Demo Technician" },
    });
    await tx.ticket.upsert({
      where: { id: "22222222-2222-4222-8222-222222222222" },
      update: {},
      create: {
        id: "22222222-2222-4222-8222-222222222222",
        customerName: "Demo Customer",
        customerPhone: "9000000000",
        deviceName: "Demo Smartphone",
        deviceType: "Phone",
        problemDescription: "Broken display — development sample",
        technicianId: technician.id,
      },
    });
  });
  console.log("Development sample ready. Ticket ID: 22222222-2222-4222-8222-222222222222");
  console.log("Existing sample records were preserved.");
} finally {
  await db.$disconnect();
}
