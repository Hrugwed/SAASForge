import Link from "next/link";
import { enabledModules, productConfig } from "@/lib/product-config";
import { requireSession } from "@/lib/session";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="product-dashboard">
      <aside>
        <Link href="/">{productConfig.name}</Link>
        <nav>
          <Link href="/dashboard">Workspace</Link>
          {enabledModules.billing ? (
            <Link href="/dashboard/billing">Billing</Link>
          ) : null}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
