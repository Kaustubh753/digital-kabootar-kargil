import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side auth guard (PRD §5.3). Verifies the session cookie before any
 * dashboard content is rendered — no flash of protected content, and it works
 * even with JS disabled.
 */
export default async function AdminPage() {
  const store = await cookies();
  if (!verifySession(store.get(SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
