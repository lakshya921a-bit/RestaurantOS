import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "node:crypto";
import { orderSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Invalid QR token." }, { status: 404 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const table = await db.diningTable.findUnique({ where: { qrTokenHash: tokenHash }, select: { id: true, branchId: true, branch: { select: { restaurantId: true } } } });
  if (!table) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order.", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  if (input.branchId !== table.branchId || input.tableId !== table.id || input.type !== "DINE_IN") {
    return NextResponse.json({ error: "Order does not match this table QR." }, { status: 400 });
  }
  try {
    const order = await db.$transaction(async tx => {
      const replay = await tx.order.findUnique({ where: { branchId_idempotencyKey: { branchId: table.branchId, idempotencyKey: input.idempotencyKey } }, include: { items: true } });
      if (replay) return replay;
      const ids = [...new Set(input.items.map(x => x.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids }, branchId: table.branchId, isAvailable: true } });
      if (products.length !== ids.length) throw new Error("An item is unavailable.");
      const map = new Map(products.map(p => [p.id, p]));
      const lines = input.items.map(i => { const p = map.get(i.productId)!; return { productId: p.id, productName: p.name, quantity: i.quantity, unitPricePaise: p.pricePaise, lineTotalPaise: p.pricePaise * i.quantity, notes: i.notes }; });
      const subtotal = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
      const max = await tx.order.aggregate({ where: { branchId: table.branchId }, _max: { orderNumber: true } });
      const created = await tx.order.create({ data: { branchId: table.branchId, orderNumber: (max._max.orderNumber ?? 0) + 1, tableId: table.id, type: "DINE_IN", subtotalPaise: subtotal, totalPaise: subtotal, idempotencyKey: input.idempotencyKey, items: { create: lines } }, include: { items: true } });
      await tx.diningTable.update({ where: { id: table.id }, data: { status: "OCCUPIED" } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ order }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not place order. Please retry safely." }, { status: 409 }); }
}
