
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getSession, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

async function getUserBranchId(restaurantId: string, branchId?: string | null) {
  if (branchId) {
    const branch = await db.collection("branches").doc(branchId).get();

    if (
      branch.exists &&
      branch.data()?.restaurantId === restaurantId &&
      branch.data()?.isActive
    ) {
      return branchId;
    }
  }

  const snapshot = await db
    .collection("branches")
    .where("restaurantId", "==", restaurantId)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].id;
}

export async function GET() {
  try {
    const session = await getSession();

    let branchId: string | null = session?.branchId ?? null;
    let restaurantId: string | null = session?.restaurantId ?? null;

    if (session && restaurantId && !branchId) {
      branchId = await getUserBranchId(restaurantId);
    }

    if (!restaurantId || !branchId) {
      const defaultBranch = await db
        .collection("branches")
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!defaultBranch.empty) {
        const doc = defaultBranch.docs[0];
        branchId = doc.id;
        restaurantId = doc.data().restaurantId;
      }
    }

    if (!branchId) {
      return NextResponse.json({
        categories: [],
        products: [],
        branch: null,
      });
    }

    const [categorySnapshot, productSnapshot, branchDoc] =
      await Promise.all([
        db.collection("menuCategories")
          .where("branchId", "==", branchId)
          .where("active", "==", true)
          .get(),

        db.collection("products")
          .where("branchId", "==", branchId)
          .get(),

        db.collection("branches").doc(branchId).get(),
      ]);

    const products: any[] = productSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    products.sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );

    const categories: any[] = categorySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      products: products.filter((product) => product.categoryId === doc.id),
    }));

    categories.sort(
      (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    );



    const branchData = branchDoc.exists ? branchDoc.data() : null;

    let restaurant = null;

    if (branchData?.restaurantId) {
      const restaurantDoc = await db
        .collection("restaurants")
        .doc(branchData.restaurantId)
        .get();

      if (restaurantDoc.exists) {
        const data = restaurantDoc.data()!;
        restaurant = {
          id: restaurantDoc.id,
          name: data.name,
          currency: data.currency,
          gstin: data.gstin ?? null,
          address: data.address ?? null,
        };
      }
    }

    const branch = branchData
      ? {
        id: branchDoc.id,
        name: branchData.name,
        phone: branchData.phone ?? null,
        address: branchData.address ?? null,
        restaurant,
      }
      : null;

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
  imageUrl: z.string().url().or(z.string().startsWith("/")).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid product data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      id,
      name,
      categoryId,
      pricePaise,
      description,
      isVeg,
      isAvailable,
      imageUrl,
    } = parsed.data;

    const branchId = await getUserBranchId(
      user.restaurantId,
      user.branchId
    );

    if (!branchId) {
      return NextResponse.json(
        { error: "No active branch found" },
        { status: 400 }
      );
    }

    const categoryDoc = await db
      .collection("menuCategories")
      .doc(categoryId)
      .get();

    if (
      !categoryDoc.exists ||
      categoryDoc.data()?.branchId !== branchId
    ) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const productData = {
      branchId,
      categoryId,
      name,
      pricePaise,
      description: description ?? null,
      isVeg,
      isAvailable,
      imageUrl: imageUrl ?? null,
      updatedAt: new Date(),
    };

    if (id) {
      const productRef = db.collection("products").doc(id);
      const productDoc = await productRef.get();

      if (
        !productDoc.exists ||
        productDoc.data()?.branchId !== branchId
      ) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      await productRef.update(productData);

      return NextResponse.json({
        product: { id, ...productData, createdAt: productDoc.data()?.createdAt },
      });
    }

    const newId = randomUUID();

    const createdProduct = {
      id: newId,
      ...productData,
      createdAt: new Date(),
    };

    await db.collection("products").doc(newId).set(createdProduct);

    return NextResponse.json(
      { product: createdProduct },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const body = await req.json().catch(() => null);

    if (!body?.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    const branchId = await getUserBranchId(
      user.restaurantId,
      user.branchId
    );

    if (!branchId) {
      return NextResponse.json(
        { error: "No active branch found" },
        { status: 400 }
      );
    }

    const productRef = db.collection("products").doc(body.id);
    const productDoc = await productRef.get();

    if (
      !productDoc.exists ||
      productDoc.data()?.branchId !== branchId
    ) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body.isAvailable === "boolean") {
      updateData.isAvailable = body.isAvailable;
    }

    if (
      typeof body.pricePaise === "number" &&
      Number.isInteger(body.pricePaise) &&
      body.pricePaise > 0
    ) {
      updateData.pricePaise = body.pricePaise;
    }

    if (typeof body.name === "string" && body.name.length >= 2) {
      updateData.name = body.name;
    }

    if (typeof body.description === "string") {
      updateData.description = body.description;
    }

    if (typeof body.isVeg === "boolean") {
      updateData.isVeg = body.isVeg;
    }

    if (typeof body.imageUrl === "string" || body.imageUrl === null) {
      updateData.imageUrl = body.imageUrl;
    }

    await productRef.update(updateData);

    return NextResponse.json({
      product: {
        id: body.id,
        ...productDoc.data(),
        ...updateData,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    const branchId = await getUserBranchId(
      user.restaurantId,
      user.branchId
    );

    if (!branchId) {
      return NextResponse.json(
        { error: "No active branch found" },
        { status: 400 }
      );
    }

    const productRef = db.collection("products").doc(id);
    const productDoc = await productRef.get();

    if (
      !productDoc.exists ||
      productDoc.data()?.branchId !== branchId
    ) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await productRef.delete();

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return apiError(e);
  }
}
