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
      <section className="auth-intro">
        <Link className="auth-brand" href="/">
          <span aria-hidden="true" className="auth-mark">
            <span>SF</span>
          </span>
          <span>{factoryConfig.name}</span>
        </Link>
        <div className="auth-copy">
          <p className="auth-eyebrow">SECURE FACTORY ACCESS</p>
          <h1>
            Return to the work.
            <span>Not the setup.</span>
          </h1>
          <p className="auth-lede">
            Sign in to the private control center where product blueprints,
            reusable capabilities, and verified operating work stay connected.
          </p>
          <ul className="auth-security">
            <li>HttpOnly session</li>
            <li>Rate limited</li>
            <li>Server verified</li>
          </ul>
        </div>
        <div aria-hidden="true" className="auth-console">
          <div className="auth-console-bar">
            <span>saasforge / access-gateway</span>
            <span>private</span>
          </div>
          <div className="auth-console-body">
            <div className="auth-console-row">
              <span>01</span>
              <span>session boundary</span>
              <span>ready</span>
            </div>
            <div className="auth-console-row">
              <span>02</span>
              <span>workspace authority</span>
              <span>verified</span>
            </div>
            <div className="auth-console-row">
              <span>03</span>
              <span>factory control plane</span>
              <span>waiting</span>
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="sign-in-title" className="auth-entry">
        <div className="auth-entry-content">
          <p className="auth-entry-kicker">IDENTITY / SIGN IN</p>
          <h2 id="sign-in-title">Authenticate your session.</h2>
          <p className="auth-entry-summary">
            Your factory workspace remains private until the server verifies
            your credentials.
          </p>
          <AuthForm mode="sign-in" />
          <p className="auth-entry-footer">
            SERVER-VERIFIED SESSION <span>◇</span> PRIVATE CONTROL PLANE
          </p>
        </div>
      </section>
    </main>
  );
}
