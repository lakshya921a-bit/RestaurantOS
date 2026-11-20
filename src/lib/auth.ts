import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32) {
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be at least 32 characters.");
}
const key = new TextEncoder().encode(secret || "local-development-secret-change-me-123456");

export type SessionUser = { id: string; restaurantId: string; branchId: string | null; role: string; email: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("12h").sign(key);
  (await cookies()).set("restaurantos_session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 12
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("restaurantos_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.id !== "string" || typeof payload.restaurantId !== "string" ||
        typeof payload.role !== "string" || typeof payload.email !== "string") return null;
    return payload as unknown as SessionUser;
  } catch { return null; }
}

export async function requireUser(roles?: string[]) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const user = await db.user.findFirst({
    where: { id: session.id, restaurantId: session.restaurantId, active: true },
    select: { id: true, restaurantId: true, branchId: true, role: true, email: true }
  });
  if (!user || (roles && !roles.includes(user.role))) throw new Error("FORBIDDEN");
  return user;
}
