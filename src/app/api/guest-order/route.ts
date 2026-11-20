import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { z } from "zod";
import { OrderType, OrderStatus } from "@prisma/client";

const guestOrderSchema = z.object({
  tableId: z.string().min(1),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    notes: z.string().max(250).optional()
  })).min(1).max(30)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = guestOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { tableId, notes, items } = parsed.data;

    // Check table
    const table = await db.diningTable.findUnique({
      where: { id: tableId },
      include: { branch: true }
    });

    if (!table) return NextResponse.json({ error: "Table not found." }, { status: 404 });

    const branchId = table.branchId;

    // Fetch verified product prices from DB
    const productIds = items.map(i => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, branchId, isAvailable: true }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more selected dishes are currently unavailable." }, { status: 400 });
    }

    const prodMap = new Map(products.map(p => [p.id, p]));

    const orderLines = items.map(i => {
      const prod = prodMap.get(i.productId)!;
      return {
        productId: prod.id,
        productName: prod.name,
        quantity: i.quantity,
        unitPricePaise: prod.pricePaise,
        lineTotalPaise: prod.pricePaise * i.quantity,
        notes: i.notes || null
      };
    });

    const subtotalPaise = orderLines.reduce((acc, line) => acc + line.lineTotalPaise, 0);
    const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST
    const totalPaise = subtotalPaise + taxPaise;

    // Get next order number
    const last = await db.order.aggregate({
      where: { branchId },
      _max: { orderNumber: true }
    });
    const orderNumber = (last._max.orderNumber ?? 100) + 1;

    const idempotencyKey = `guest-${table.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const createdOrder = await db.order.create({
      data: {
        branchId,
        orderNumber,
        tableId: table.id,
        type: OrderType.DINE_IN,
        status: OrderStatus.PENDING,
        subtotalPaise,
        taxPaise,
        discountPaise: 0,
        totalPaise,
        notes: notes || "Order placed via Guest Table QR Portal",
        idempotencyKey,
        items: {
          create: orderLines
        }
      },
      include: {
        items: true,
        table: { select: { name: true, zone: true } }
      }
    });

    // Mark table occupied
    await db.diningTable.update({
      where: { id: table.id },
      data: { status: "OCCUPIED" }
    });

    return NextResponse.json({
      success: true,
      order: createdOrder,
      message: `Order #${createdOrder.orderNumber} placed for Table ${table.name}! Sent to kitchen.`
    }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const tableId = searchParams.get("tableId");

    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true, table: true }
      });
      return NextResponse.json({ order });
    }

    if (tableId) {
      const activeOrder = await db.order.findFirst({
        where: {
          tableId,
          status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] }
        },
        include: { items: true, table: true },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ order: activeOrder });
    }

    return NextResponse.json({ error: "Missing orderId or tableId" }, { status: 400 });
  } catch (e) {
    return apiError(e);
  }
}
