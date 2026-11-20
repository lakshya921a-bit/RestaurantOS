import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export async function GET(_req: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Invalid QR token." }, { status: 404 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const table = await db.diningTable.findUnique({ where: { qrTokenHash: tokenHash }, select: { id: true, name: true, branchId: true, branch: { select: { name: true, restaurant: { select: { name: true } } } } } });
  if (!table) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  const categories = await db.menuCategory.findMany({
    where: { branchId: table.branchId, active: true },
    orderBy: { sortOrder: "asc" },
    include: { products: { where: { isAvailable: true }, select: { id: true, name: true, description: true, pricePaise: true, isVeg: true, imageUrl: true } } }
  });
  return NextResponse.json({ restaurant: table.branch.restaurant.name, branch: table.branch.name, table: table.name, categories });
}
