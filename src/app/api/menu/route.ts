import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSession();
    
    // Find restaurant & branch (either from session or fallback to default flagship)
    let branchId: string | undefined = session?.branchId ?? undefined;
    let restaurantId: string | undefined = session?.restaurantId ?? undefined;

    if (!restaurantId || !branchId) {
      const defaultBranch = await db.branch.findFirst({
        where: { isActive: true },
        include: { restaurant: true }
      });
      if (defaultBranch) {
        branchId = defaultBranch.id;
        restaurantId = defaultBranch.restaurantId;
      }
    }

    const categories = await db.menuCategory.findMany({
      where: branchId ? { branchId, active: true } : { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          orderBy: { name: "asc" }
        }
      }
    });

    const products = await db.product.findMany({
      where: branchId ? { branchId } : {},
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    });

    const branch = await db.branch.findFirst({
      where: branchId ? { id: branchId } : {},
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
            gstin: true,
            address: true
          }
        }
      }
    });

    return NextResponse.json({ categories, products, branch });
  } catch (e) {
    return apiError(e);
  }
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(100),
  categoryId: z.string().min(1),
  pricePaise: z.number().int().min(100),
  description: z.string().max(500).optional(),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().or(z.string().startsWith("/")).optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, categoryId, pricePaise, description, isVeg, isAvailable, imageUrl } = parsed.data;
    const branchId = user.branchId || (await db.branch.findFirst({ where: { restaurantId: user.restaurantId } }))?.id;
    if (!branchId) return NextResponse.json({ error: "No active branch found" }, { status: 400 });

    if (id) {
      const updated = await db.product.update({
        where: { id },
        data: { name, categoryId, pricePaise, description, isVeg, isAvailable, imageUrl: imageUrl ?? null }
      });
      return NextResponse.json({ product: updated });
    }

    const created = await db.product.create({
      data: {
        branchId,
        categoryId,
        name,
        pricePaise,
        description,
        isVeg,
        isAvailable,
        imageUrl: imageUrl ?? null
      }
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);
    if (!body?.id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    const updateData: { isAvailable?: boolean; pricePaise?: number; name?: string; description?: string; isVeg?: boolean; imageUrl?: string } = {};
    if (typeof body.isAvailable === "boolean") updateData.isAvailable = body.isAvailable;
    if (typeof body.pricePaise === "number" && body.pricePaise > 0) updateData.pricePaise = body.pricePaise;
    if (typeof body.name === "string" && body.name.length >= 2) updateData.name = body.name;
    if (typeof body.description === "string") updateData.description = body.description;
    if (typeof body.isVeg === "boolean") updateData.isVeg = body.isVeg;
    if (typeof body.imageUrl === "string") updateData.imageUrl = body.imageUrl;

    const updated = await db.product.update({
      where: { id: body.id },
      data: updateData
    });

    return NextResponse.json({ product: updated });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    return apiError(e);
  }
}
