import { inventoryErrorResponse, readJson } from "@/features/inventory/api-errors";
import { updatePart } from "@/features/inventory/parts-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json({ data: await updatePart(id, await readJson(request)) });
  } catch (error) {
    return inventoryErrorResponse(error);
  }
}
