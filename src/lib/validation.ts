import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128)
});
export const orderSchema = z.object({
  branchId: z.string().min(1),
  tableId: z.string().min(1).nullable().optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(12).max(128),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().max(250).optional()
  })).min(1).max(50)
});
