import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { factoryConfig } from "@/lib/factory-config";
import { getSession } from "@/lib/session";
import "../auth/auth.css";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
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
          <span>{factoryConfig.name}</span>
        </Link>
        <div className="auth-copy">
          <p>SECURE ACCESS</p>
          <h1>Welcome back to the factory.</h1>
          <p>
            Sign in to your protected product command center and continue
            building.
          </p>
          <div className="auth-security">
            <span>HttpOnly session</span>
            <span>Rate limited</span>
            <span>Server verified</span>
          </div>
        </div>
      </section>
      <AuthForm mode="sign-in" />
    </main>
  );
}
