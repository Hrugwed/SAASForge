import Link from "next/link";
import { redirect } from "next/navigation";
import { productConfig } from "@saasforge/config";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";
import "../auth/auth.css";

export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
  if (await getSession()) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="forge-mark">
            SF
          </span>
          <span>{productConfig.name}</span>
        </Link>
        <div className="auth-copy">
          <p>START BUILDING</p>
          <h1>Create your secure workspace.</h1>
          <p>
            Your account receives an isolated organization with owner access,
            ready for product data and billing.
          </p>
          <div className="auth-security">
            <span>Scrypt password hash</span>
            <span>Tenant isolated</span>
            <span>12 character minimum</span>
          </div>
        </div>
      </section>
      <AuthForm mode="sign-up" />
    </main>
  );
}
