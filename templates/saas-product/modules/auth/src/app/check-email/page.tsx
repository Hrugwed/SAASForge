import { CheckEmailForm } from "@/components/auth/recovery-forms";
import "../auth.css";

export const metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="product-auth-page">
      <section>
        <p>IDENTITY VERIFICATION</p>
        <h1>One more step.</h1>
        <span>Verification protects accounts and workspace invitations.</span>
      </section>
      <CheckEmailForm email={query.email} />
    </main>
  );
}
