import { z } from "zod";
export const ticketStatuses = ["NEW", "IN_PROGRESS", "READY_FOR_PICKUP", "DELIVERED"] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const statusLabels = { NEW: "New", IN_PROGRESS: "In Progress", READY_FOR_PICKUP: "Ready for Pickup", DELIVERED: "Delivered" };
const phone = z.string().trim().min(7).max(25).regex(/^\+?[0-9 ()-]+$/, "Enter a valid contact number");
export const createTicketSchema = z.object({
 customerName: z.string().trim().min(1).max(120),
 customerPhone: phone,
 deviceName: z.string().trim().min(1).max(120),
 deviceType: z.string().trim().min(1).max(80),
 problemDescription: z.string().trim().min(1).max(3000),
 priority: z.enum(priorities).default("MEDIUM"),
 technicianId: z.uuid().nullable().optional(),
}).strict();
export const createTechnicianSchema = z.object({ name: z.string().trim().min(1).max(120), phone: phone.optional() }).strict();
export type ApiError = { error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
export type ApiResult<T> = { data: T };
export type Paginated<T> = { data: T[]; meta: { page: number; pageSize: number; total: number } };
