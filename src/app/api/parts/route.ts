import { inventoryErrorResponse, readJson } from "@/features/inventory/api-errors";
import { createPart, listParts } from "@/features/inventory/parts-service";

export async function GET(request: Request) {
  try {
    return Response.json(await listParts(Object.fromEntries(new URL(request.url).searchParams)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return inventoryErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json({ data: await createPart(await readJson(request)) }, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error);
  }
}
