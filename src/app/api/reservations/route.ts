import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { ReservationStatus } from "@prisma/client";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSession();
    let branchId = session?.branchId;

    if (!branchId) {
      const b = await db.branch.findFirst({ where: { isActive: true } });
      branchId = b?.id;
    }

    const reservations = await db.reservation.findMany({
      where: branchId ? { branchId } : {},
      include: {
        table: {
          select: { name: true, zone: true, capacity: true }
        }
      },
      orderBy: { startsAt: "desc" },
      take: 50
    });

    return NextResponse.json({ reservations });
  } catch (e) {
    return apiError(e);
  }
}

const bookingSchema = z.object({
  guestName: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
  partySize: z.number().int().min(1).max(20),
  startsAt: z.string().datetime().or(z.string().min(8)),
  tableId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid booking details", details: parsed.error.flatten() }, { status: 400 });
    }

    const { guestName, phone, partySize, startsAt, tableId, notes } = parsed.data;

    // Get default branch
    const branch = await db.branch.findFirst({ where: { isActive: true } });
    if (!branch) return NextResponse.json({ error: "Branch not active" }, { status: 400 });

    const dateParsed = new Date(startsAt);

    // If table selected, update table status to RESERVED if within today
    if (tableId) {
      await db.diningTable.update({
        where: { id: tableId },
        data: { status: "RESERVED" }
      }).catch(() => null);
    }

    const reservation = await db.reservation.create({
      data: {
        branchId: branch.id,
        guestName,
        phone,
        partySize,
        startsAt: dateParsed,
        tableId: tableId || null,
        notes: notes || null,
        status: ReservationStatus.BOOKED
      },
      include: {
        table: { select: { name: true, zone: true } }
      }
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: `Table reservation confirmed for ${guestName}! Booking reference #${reservation.id.slice(-6).toUpperCase()}`
    }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireUser(["OWNER", "MANAGER", "WAITER", "CASHIER"]);
    const body = await req.json().catch(() => null);
    if (!body?.id || !body?.status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const validStatuses = Object.values(ReservationStatus);
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid reservation status" }, { status: 400 });
    }

    const updated = await db.reservation.update({
      where: { id: body.id },
      data: { status: body.status }
    });

    return NextResponse.json({ reservation: updated });
  } catch (e) {
    return apiError(e);
  }
}
