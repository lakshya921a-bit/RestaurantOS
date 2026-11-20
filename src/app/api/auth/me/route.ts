import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      restaurant: { select: { name: true, slug: true, currency: true, gstin: true } },
      branch: { select: { id: true, name: true } }
    }
  });

  return NextResponse.json({ user });
}
