import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { productConfig } from "@/lib/product-config";
import { getSession } from "@/lib/session";
import "../auth.css";

export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="product-auth-page">
      <section>
        <Link href="/">{productConfig.name}</Link>
        <p>CREATE YOUR WORKSPACE</p>
        <h1>Start with secure foundations.</h1>
        <span>Your personal organization is created with owner access.</span>
      </section>
      <AuthForm mode="sign-up" />
    </main>
  );
}
