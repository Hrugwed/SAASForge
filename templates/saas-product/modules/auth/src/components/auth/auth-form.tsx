"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@saasforge/auth/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const result = isSignUp
      ? await authClient.signUp.email({
          email,
          name: String(form.get("name") ?? "").trim(),
          password,
        })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(
        isSignUp
          ? "Account creation failed. Check the details."
          : "The email or password is incorrect.",
      );
      setPending(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="product-auth-form" onSubmit={submit}>
      {isSignUp ? (
        <label>
          <span>Name</span>
          <input
            autoComplete="name"
            minLength={2}
            maxLength={80}
            name="name"
            required
          />
        </label>
      ) : null}
      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={12}
          maxLength={128}
          name="password"
          required
          type="password"
        />
      </label>
      <div aria-live="polite" className="product-auth-error">
        {error}
      </div>
      <button disabled={pending} type="submit">
        {pending ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>
      <p>
        {isSignUp ? "Already registered?" : "Need an account?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
