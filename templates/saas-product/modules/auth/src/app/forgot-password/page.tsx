import { ForgotPasswordForm } from "@/components/auth/recovery-forms";
import "../auth.css";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="product-auth-page">
      <section>
        <p>ACCOUNT RECOVERY</p>
        <h1>Get back in.</h1>
        <span>We never reveal whether an email is registered.</span>
      </section>
      <ForgotPasswordForm />
    </main>
  );
}
