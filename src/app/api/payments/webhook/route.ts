import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  // Provider event mapping must be implemented against the exact Razorpay event
  // contract used by the deployed account. Never trust browser redirects for payment state.
  const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; status?: string; notes?: { restaurantosPaymentId?: string } } } } };
  const providerPaymentId = event.payload?.payment?.entity?.id;
  const internalId = event.payload?.payment?.entity?.notes?.restaurantosPaymentId;
  if (event.event === "payment.captured" && providerPaymentId && internalId) {
    await db.payment.updateMany({ where: { id: internalId, status: "PENDING" }, data: { status: "PAID", providerReference: providerPaymentId } });
  }
  return NextResponse.json({ received: true });
}
