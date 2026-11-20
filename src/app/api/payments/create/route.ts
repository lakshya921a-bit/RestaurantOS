import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { apiError } from "@/lib/http";

const schema = z.object({
  orderId: z.string().min(1), amountPaise: z.number().int().positive(),
  method: z.enum(["CASH", "CARD", "UPI", "ONLINE"]),
  idempotencyKey: z.string().min(12).max(128)
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER", "CASHIER"]);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
    const input = parsed.data;
    const payment = await db.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id: input.orderId, branch: { restaurantId: user.restaurantId }, branchId: user.branchId ?? undefined }, include: { payments: true } });
      if (!order) throw new Error("Order not found.");
      const paid = order.payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amountPaise, 0);
      if (input.amountPaise > order.totalPaise - paid) throw new Error("Payment exceeds remaining balance.");
      const existing = await tx.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) return existing;
      // Cash is recorded as paid by an authenticated cashier. Card/UPI/online remain pending
      // until a trusted payment provider webhook verifies the transaction.
      return tx.payment.create({ data: {
        orderId: order.id, amountPaise: input.amountPaise, method: input.method,
        status: input.method === "CASH" ? "PAID" : "PENDING",
        provider: input.method === "CASH" ? "CASH_REGISTER" : "PAYMENT_PROVIDER",
        idempotencyKey: input.idempotencyKey
      }});
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) { return apiError(e); }
}
