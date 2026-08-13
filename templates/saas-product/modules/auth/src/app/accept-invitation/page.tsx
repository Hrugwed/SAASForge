import { AcceptInvitationForm } from "@/components/auth/recovery-forms";
import "../auth.css";

export const metadata = {
  title: "Accept invitation",
  robots: { index: false, follow: false },
};

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="product-auth-page">
      <section>
        <p>WORKSPACE INVITATION</p>
        <h1>Join your team.</h1>
        <span>Only the verified invited email can accept this invitation.</span>
      </section>
      <AcceptInvitationForm invitationId={query.invitationId} />
    </main>
  );
}
