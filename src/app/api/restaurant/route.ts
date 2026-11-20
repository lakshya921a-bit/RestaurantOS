import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { z } from "zod";

export async function GET() {
  try {
    const restaurant = await db.restaurant.findFirst({
      include: {
        branches: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not configured" }, { status: 404 });
    }

    const branch = restaurant.branches[0];

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        currency: restaurant.currency,
        timezone: restaurant.timezone,
        gstin: restaurant.gstin || "27AABCS1429B1Z0",
        address: restaurant.address || "Cyber Hub, Galleria Avenue, Gurgaon",
        phone: branch?.phone || "+91 98765 43210",
        branchName: branch?.name || "Main Flagship",
        openingHours: "Mon-Sun: 12:00 PM – 11:30 PM",
        tagline: "Artisanal Indian & Continental Fine Dining",
        description: "Experience royal culinary traditions reimagined for the modern epicurean. From slow-simmered charcoal dals to artisanal wood-fired pizzas, Spice Symphony crafts each plate with local provenance and global technique."
      }
    });
  } catch (e) {
    return apiError(e);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(250).optional(),
  phone: z.string().max(30).optional(),
  gstin: z.string().max(30).optional(),
  currency: z.string().max(10).optional()
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, address, phone, gstin, currency } = parsed.data;

    const restaurant = await db.restaurant.findFirst({
      where: { id: user.restaurantId }
    });

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const updatedRestaurant = await db.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: name ?? restaurant.name,
        address: address ?? restaurant.address,
        gstin: gstin ?? restaurant.gstin,
        currency: currency ?? restaurant.currency
      }
    });

    if (phone || address) {
      const branch = await db.branch.findFirst({
        where: { restaurantId: restaurant.id }
      });
      if (branch) {
        await db.branch.update({
          where: { id: branch.id },
          data: {
            phone: phone ?? branch.phone,
            address: address ?? branch.address
          }
        });
      }
    }

    return NextResponse.json({ restaurant: updatedRestaurant });
  } catch (e) {
    return apiError(e);
  }
}
