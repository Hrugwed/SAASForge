import { SignOutButton } from "@/components/auth/sign-out-button";
import { getPrimaryMembership } from "@/lib/organization";
import { requireSession } from "@/lib/session";

export const metadata = {
  title: "Workspace",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await requireSession();
  const membership = await getPrimaryMembership(session.user.id);
  return (
    <div className="product-dashboard-content">
      <header>
        <div>
          <p>PRODUCT WORKSPACE</p>
          <h1>Build the core customer outcome here.</h1>
          <span>{membership?.organization.name ?? "Workspace pending"}</span>
        </div>
        <SignOutButton />
      </header>
      <section>
        <article>
          <span>Account</span>
          <strong>Ready</strong>
        </article>
        <article>
          <span>Role</span>
          <strong>{membership?.role ?? "Pending"}</strong>
        </article>
        <article>
          <span>Core workflow</span>
          <strong>Next</strong>
        </article>
      </section>
    </div>
  );
}
