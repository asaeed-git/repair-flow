import { Prisma } from "@prisma/client";
import { z } from "zod";

export class InventoryError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InventoryError(400, "VALIDATION_ERROR", "Send a valid JSON body");
  }
}

export function inventoryErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    const { fieldErrors, formErrors } = z.flattenError(error);
    return Response.json({ error: {
      code: "VALIDATION_ERROR",
      message: formErrors.join(". ") || "Check the highlighted fields",
      fieldErrors,
    } }, { status: 400 });
  }
  if (error instanceof InventoryError) {
    return Response.json({ error: {
      code: error.code, message: error.message, fieldErrors: error.fieldErrors,
    } }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return Response.json({ error: {
      code: "DUPLICATE_PART_CODE",
      message: "A part with this code already exists",
      fieldErrors: { partCode: ["Choose a unique part code"] },
    } }, { status: 409 });
  }
  // Keep database details and connection credentials out of the HTTP response.
  console.error("Inventory request failed", error instanceof Error ? error.name : "Unknown error");
  return Response.json({ error: {
    code: "INTERNAL_ERROR", message: "Unable to save or load inventory. Please try again.", fieldErrors: {},
  } }, { status: 500 });
}
