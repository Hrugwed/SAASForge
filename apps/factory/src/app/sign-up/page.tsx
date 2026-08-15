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
      <section className="auth-intro">
        <Link className="auth-brand" href="/">
          <span aria-hidden="true" className="auth-mark">
            <span>SF</span>
          </span>
          <span>{factoryConfig.name}</span>
        </Link>
        <div className="auth-copy">
          <p className="auth-eyebrow">PRIVATE FACTORY ACCESS</p>
          <h1>
            Build from a clean boundary.
            <span>Keep the edge yours.</span>
          </h1>
          <p className="auth-lede">
            Create the private owner workspace for selecting foundations,
            managing independent products, and carrying forward the work that
            should never be rebuilt.
          </p>
          <ul className="auth-security">
            <li>Scrypt password hash</li>
            <li>Tenant isolated</li>
            <li>12 character minimum</li>
          </ul>
        </div>
        <div aria-hidden="true" className="auth-console">
          <div className="auth-console-bar">
            <span>saasforge / workspace-provisioning</span>
            <span>new owner</span>
          </div>
          <div className="auth-console-body">
            <div className="auth-console-row">
              <span>01</span>
              <span>identity record</span>
              <span>prepare</span>
            </div>
            <div className="auth-console-row">
              <span>02</span>
              <span>owner workspace</span>
              <span>isolated</span>
            </div>
            <div className="auth-console-row">
              <span>03</span>
              <span>factory access</span>
              <span>pending</span>
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="sign-up-title" className="auth-entry">
        <div className="auth-entry-content">
          <p className="auth-entry-kicker">IDENTITY / CREATE OWNER</p>
          <h2 id="sign-up-title">Claim the factory workspace.</h2>
          <p className="auth-entry-summary">
            This creates your protected owner session; product data and provider
            decisions remain separate by design.
          </p>
          <AuthForm mode="sign-up" />
          <p className="auth-entry-footer">
            ISOLATED BY DEFAULT <span>◇</span> READY FOR YOUR PRODUCT
          </p>
        </div>
      </section>
    </main>
  );
}
