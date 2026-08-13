import { ResetPasswordForm } from "@/components/auth/recovery-forms";
import "../auth.css";

export const metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="product-auth-page">
      <section>
        <p>ACCOUNT RECOVERY</p>
        <h1>Choose securely.</h1>
        <span>Resetting your password revokes your other sessions.</span>
      </section>
      <ResetPasswordForm token={query.token} invalid={Boolean(query.error)} />
    </main>
  );
}
