import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { TableStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();

    let branchId: string | undefined = session?.branchId ?? undefined;
    let restaurantId: string | undefined = session?.restaurantId ?? undefined;

    if (!restaurantId || !branchId) {
      const defaultBranch = await db.branch.findFirst({
        where: { isActive: true }
      });
      if (defaultBranch) {
        branchId = defaultBranch.id;
        restaurantId = defaultBranch.restaurantId;
      }
    }

    const tables = await db.diningTable.findMany({
      where: branchId ? { branchId } : {},
      select: {
        id: true,
        name: true,
        capacity: true,
        zone: true,
        status: true,
        qrTokenHash: session ? true : false,
        orders: session ? {
          where: { status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] } },
          select: { id: true, orderNumber: true, totalPaise: true, status: true, items: { select: { quantity: true, productName: true } } },
          take: 1
        } : false
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ tables });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER", "WAITER", "CASHIER"]);
    const body = await req.json().catch(() => null);
    if (!body?.id || !body?.status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const validStatuses = Object.values(TableStatus);
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid table status" }, { status: 400 });
    }

    const updated = await db.diningTable.update({
      where: { id: body.id },
      data: { status: body.status }
    });

    return NextResponse.json({ table: updated });
  } catch (e) {
    return apiError(e);
  }
}
