import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { factoryConfig } from "@/lib/factory-config";
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
          <span>{factoryConfig.name}</span>
        </Link>
        <div className="auth-copy">
          <p>PRIVATE FACTORY ACCESS</p>
          <h1>Create your secure factory workspace.</h1>
          <p>
            Your account receives an isolated owner workspace for managing
            products, reusable modules, and launch operations.
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
