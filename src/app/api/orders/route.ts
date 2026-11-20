import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { orderSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await db.order.findMany({
      where: { branchId: user.branchId ?? undefined, branch: { restaurantId: user.restaurantId } },
      include: {
        items: true,
        table: { select: { name: true, zone: true } },
        payments: true,
        branch: { select: { id: true, name: true, address: true, phone: true, restaurant: { select: { name: true, gstin: true, address: true, currency: true } } } }
      },
      orderBy: { createdAt: "desc" }, take: 100
    });
    return NextResponse.json({ orders });
  } catch (e) { return apiError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER", "CASHIER", "WAITER"]);
    const parsed = orderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid order details.", details: parsed.error.flatten() }, { status: 400 });
    const input = parsed.data;
    if (user.branchId && input.branchId !== user.branchId) return NextResponse.json({ error: "Branch access denied." }, { status: 403 });

    const existing = await db.order.findUnique({ where: { branchId_idempotencyKey: { branchId: input.branchId, idempotencyKey: input.idempotencyKey } }, include: { items: true } });
    if (existing) return NextResponse.json({ order: existing, replayed: true });

    const order = await db.$transaction(async tx => {
      const branch = await tx.branch.findFirst({ where: { id: input.branchId, restaurantId: user.restaurantId, isActive: true } });
      if (!branch) throw new Error("FORBIDDEN");
      if (input.tableId) {
        const table = await tx.diningTable.findFirst({ where: { id: input.tableId, branchId: input.branchId } });
        if (!table) throw new Error("Invalid table.");
        const active = await tx.order.findFirst({ where: { tableId: table.id, status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] } } });
        if (active) throw new Error("This table already has an active order.");
      }
      const ids = [...new Set(input.items.map(i => i.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids }, branchId: input.branchId, isAvailable: true } });
      if (products.length !== ids.length) throw new Error("One or more menu items are unavailable.");
      const productMap = new Map(products.map(p => [p.id, p]));
      const lines = input.items.map(i => {
        const p = productMap.get(i.productId)!;
        return { productId: p.id, productName: p.name, quantity: i.quantity, unitPricePaise: p.pricePaise, lineTotalPaise: p.pricePaise * i.quantity, notes: i.notes };
      });
      const subtotal = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
      const last = await tx.order.aggregate({ where: { branchId: input.branchId }, _max: { orderNumber: true } });
      const created = await tx.order.create({
        data: {
          branchId: input.branchId, orderNumber: (last._max.orderNumber ?? 0) + 1,
          tableId: input.tableId ?? null, type: input.type, notes: input.notes,
          subtotalPaise: subtotal, totalPaise: subtotal, idempotencyKey: input.idempotencyKey,
          items: { create: lines }
        }, include: { items: true }
      });
      if (input.tableId) await tx.diningTable.update({ where: { id: input.tableId }, data: { status: "OCCUPIED" } });
      await tx.auditLog.create({ data: { userId: user.id, restaurantId: user.restaurantId, action: "ORDER_CREATED", entityType: "Order", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) { return apiError(e); }
}
