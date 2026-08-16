import Link from "next/link";
import { Button } from "@saasforge/ui";
import "../auth/auth.css";

export const metadata = {
  title: "Factory access required",
  robots: { index: false, follow: false },
};

const accessCopy = {
  configuration: {
    title: "Operator access is not configured.",
    heading: "Choose the factory operator organization.",
    summary: (
      <>
        Set <code>SAASFORGE_OPERATOR_ORGANIZATION_ID</code> on the factory
        server, restart it, and sign in as an owner or administrator of that
        organization.
      </>
    ),
  },
  membership: {
    title: "This account is not a factory operator.",
    heading: "Join the configured operator organization.",
    summary: (
      <>
        Ask an existing organization owner to add this account to the factory
        operator organization, then sign in again.
      </>
    ),
  },
  role: {
    title: "Owner or administrator access is required.",
    heading: "Request an operator role.",
    summary: (
      <>
        This account is a member, but its current role cannot inspect factory
        repository metadata. Ask an organization owner to grant an owner or
        administrator role.
      </>
    ),
  },
} as const;

type AccessReason = keyof typeof accessCopy;

function isAccessReason(value: string | undefined): value is AccessReason {
  return Boolean(value && Object.hasOwn(accessCopy, value));
}

export default async function FactoryAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const requestedReason = (await searchParams).reason;
  const reason = isAccessReason(requestedReason)
    ? requestedReason
    : "configuration";
  const copy = accessCopy[reason];

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="factory-access-title">
        <Link className="auth-brand" href="/">
          <span className="auth-mark" aria-hidden="true">
            <span>SF</span>
          </span>
          <strong>SaaSForge</strong>
        </Link>
        <div className="auth-copy">
          <p className="auth-eyebrow">PRIVATE CONTROL PLANE</p>
          <h1 id="factory-access-title">{copy.title}</h1>
          <p className="auth-lede">
            Public factory installations require an explicit operator
            organization before repository metadata can be inspected.
          </p>
          <ul className="auth-security">
            <li>Local access requires explicit local operator mode.</li>
            <li>Hosted access fails closed without an organization policy.</li>
            <li>
              Product secrets and customer data never enter this dashboard.
            </li>
          </ul>
        </div>
        <div className="auth-console" aria-label="Authorization policy">
          <div className="auth-console-bar">
            <span>FACTORY / ACCESS POLICY</span>
            <span>FAIL CLOSED</span>
          </div>
          <div className="auth-console-body">
            <div className="auth-console-row">
              <span>01</span>
              <span>Authenticated operator membership</span>
              <span>required</span>
            </div>
            <div className="auth-console-row">
              <span>02</span>
              <span>Owner or administrator role</span>
              <span>required</span>
            </div>
            <div className="auth-console-row">
              <span>03</span>
              <span>Repository evidence boundary</span>
              <span>enforced</span>
            </div>
          </div>
        </div>
      </section>
      <section className="auth-entry" aria-label="Factory access guidance">
        <div className="auth-entry-content">
          <p className="auth-entry-kicker">ACCESS / DENIED</p>
          <h2>{copy.heading}</h2>
          <p className="auth-entry-summary">{copy.summary}</p>
          <Button asChild size="lg">
            <Link href="/">Return to factory overview</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
