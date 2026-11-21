import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const userDoc = await db
      .collection("users")
      .doc(session.id)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json({ user: null });
    }

    const userData = userDoc.data()!;

    if (
      !userData.active ||
      userData.restaurantId !== session.restaurantId
    ) {
      return NextResponse.json({ user: null });
    }

    const [restaurantDoc, branchDoc] = await Promise.all([
      db.collection("restaurants").doc(userData.restaurantId).get(),
      userData.branchId
        ? db.collection("branches").doc(userData.branchId).get()
        : Promise.resolve(null),
    ]);

    const restaurant = restaurantDoc.exists
      ? restaurantDoc.data()
      : null;

    const branch = branchDoc?.exists
      ? branchDoc.data()
      : null;

    const user = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      branchId: userData.branchId ?? null,
      restaurant: restaurant
        ? {
          name: restaurant.name,
          slug: restaurant.slug,
          currency: restaurant.currency,
          gstin: restaurant.gstin ?? null,
        }
        : null,
      branch: branch
        ? {
          id: branchDoc!.id,
          name: branch.name,
        }
        : null,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}