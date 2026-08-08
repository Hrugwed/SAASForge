"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@saasforge/auth/client";
import { Button } from "@saasforge/ui";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
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
          ? "We could not create that account. Check the details and try again."
          : "The email or password is incorrect.",
      );
      setPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {isSignUp ? (
        <label>
          <span>Name</span>
          <input
            autoComplete="name"
            maxLength={80}
            minLength={2}
            name="name"
            placeholder="Alex Morgan"
            required
            type="text"
          />
        </label>
      ) : null}

      <label>
        <span>Email</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          maxLength={128}
          minLength={12}
          name="password"
          placeholder={isSignUp ? "At least 12 characters" : "Your password"}
          required
          type="password"
        />
      </label>

      <div aria-live="polite" className="auth-message">
        {error}
      </div>

      <Button disabled={pending} size="lg" type="submit">
        {pending
          ? "Please wait..."
          : isSignUp
            ? "Create secure account"
            : "Sign in"}
      </Button>

      <p className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to SaaSForge?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
