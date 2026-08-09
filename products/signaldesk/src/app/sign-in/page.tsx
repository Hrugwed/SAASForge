import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { productConfig } from "@/lib/product-config";
import { getSession } from "@/lib/session";
import "../auth.css";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="product-auth-page">
      <section>
        <Link href="/">{productConfig.name}</Link>
        <p>SECURE PRODUCT ACCESS</p>
        <h1>Welcome back.</h1>
        <span>Continue to your protected workspace.</span>
      </section>
      <AuthForm mode="sign-in" />
    </main>
  );
}
