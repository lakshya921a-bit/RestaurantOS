import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Dashboard from "@/components/dashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      restaurant: { select: { name: true, slug: true, currency: true, gstin: true, address: true } },
      branch: { select: { id: true, name: true, phone: true, address: true } }
    }
  });

  return (
    <Dashboard
      user={{
        id: user?.id || session.id,
        name: user?.name || "Executive User",
        email: session.email,
        role: session.role,
        branchId: user?.branchId || session.branchId || "",
        restaurantName: user?.restaurant?.name || "Spice Symphony & Grand Bistro",
        branchName: user?.branch?.name || "Flagship Cyber Hub"
      }}
    />
  );
}
