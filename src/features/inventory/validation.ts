import { z } from "zod";

export const MAX_STOCK = 2_147_483_647;
const nonnegativeInteger = z.number().int().min(0).max(MAX_STOCK);
const partDetails = {
  partCode: z.string().trim().toUpperCase().min(1, "Enter a part code").max(60),
  name: z.string().trim().min(1, "Enter a part name").max(120),
  unitPriceMinor: nonnegativeInteger,
  lowStockThreshold: nonnegativeInteger,
};

export const createPartSchema = z.object({
  ...partDetails,
  quantity: nonnegativeInteger,
}).strict();

export const updatePartSchema = z.object({
  ...partDetails,
  stockAdjustment: z.number().int().min(-MAX_STOCK).max(MAX_STOCK),
}).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one field to update",
});

export const partIdSchema = z.uuid();
const queryInteger = z.string().regex(/^\d+$/, "Enter a positive whole number").transform(Number);
export const partsQuerySchema = z.object({
  page: queryInteger.pipe(z.number().int().min(1).max(MAX_STOCK)).default(1),
  pageSize: queryInteger.pipe(z.number().int().min(1).max(100)).default(20),
}).refine(({ page, pageSize }) => (page - 1) * pageSize <= MAX_STOCK, {
  message: "Page is out of range", path: ["page"],
});
