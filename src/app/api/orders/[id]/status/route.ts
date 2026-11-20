import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { z } from "zod";

const schema = z.object({ status: z.enum(["ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]) });
const allowed: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"], ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"], READY: ["SERVED", "COMPLETED"],
  SERVED: ["COMPLETED"], COMPLETED: [], CANCELLED: []
};

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN"]);
    const { id } = await context.params;
    const body = schema.safeParse(await req.json().catch(() => null));
    if (!body.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    const updated = await db.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id, branch: { restaurantId: user.restaurantId }, branchId: user.branchId ?? undefined } });
      if (!order) throw new Error("Order not found.");
      if (!allowed[order.status].includes(body.data.status)) throw new Error(`Invalid transition from ${order.status} to ${body.data.status}.`);
      const result = await tx.order.update({ where: { id }, data: { status: body.data.status } });
      if (body.data.status === "COMPLETED" && order.tableId) {
        await tx.diningTable.updateMany({ where: { id: order.tableId, branchId: order.branchId }, data: { status: "CLEANING" } });
      }
      await tx.auditLog.create({ data: { userId: user.id, restaurantId: user.restaurantId, action: "ORDER_STATUS_CHANGED", entityType: "Order", entityId: id, metadata: { from: order.status, to: body.data.status } } });
      return result;
    });
    return NextResponse.json({ order: updated });
  } catch (e) { return apiError(e); }
}
