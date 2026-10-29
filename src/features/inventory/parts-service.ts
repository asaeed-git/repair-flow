import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { InventoryError } from "./api-errors";
import { createPartSchema, MAX_STOCK, partIdSchema, partsQuerySchema, updatePartSchema } from "./validation";

export async function listParts(query: Record<string, string>) {
  const { page, pageSize } = partsQuerySchema.parse(query);
  const [data, total] = await db.$transaction([
    db.part.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.part.count(),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  return { data, meta: { page, pageSize, total } };
}

export async function createPart(input: unknown) {
  return db.part.create({ data: createPartSchema.parse(input) });
}

export async function updatePart(id: string, input: unknown) {
  partIdSchema.parse(id);
  const { stockAdjustment = 0, ...details } = updatePartSchema.parse(input);
  return db.$transaction(async (tx) => {
    // The condition and increment run in one UPDATE, so concurrent allocations or
    // adjustments cannot consume the same stock or overwrite a newer quantity.
    const result = await tx.part.updateMany({
      where: {
        id,
        quantity: stockAdjustment < 0
          ? { gte: -stockAdjustment }
          : { lte: MAX_STOCK - stockAdjustment },
      },
      data: { ...details, quantity: { increment: stockAdjustment } },
    });
    if (result.count === 0) {
      const part = await tx.part.findUnique({ where: { id }, select: { id: true } });
      if (!part) throw new InventoryError(404, "PART_NOT_FOUND", "This part no longer exists");
      const message = stockAdjustment < 0
        ? "Not enough stock for this adjustment"
        : "This adjustment exceeds the maximum supported stock";
      throw new InventoryError(409, stockAdjustment < 0 ? "INSUFFICIENT_STOCK" : "STOCK_LIMIT_EXCEEDED", message, {
        stockAdjustment: [message],
      });
    }
    return tx.part.findUniqueOrThrow({ where: { id } });
  });
}
