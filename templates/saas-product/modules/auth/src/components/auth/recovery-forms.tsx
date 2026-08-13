"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@saasforge/auth/client";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await authClient.requestPasswordReset({
      email: String(form.get("email") ?? "").trim(),
      redirectTo: "/reset-password",
    });
    setMessage("If that account exists, a reset link has been sent.");
  }

  return (
    <form className="product-auth-form" onSubmit={submit}>
      <h2>Reset your password</h2>
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
      <p aria-live="polite">{message}</p>
      <button type="submit">Send reset link</button>
      <Link href="/sign-in">Return to sign in</Link>
    </form>
  );
}

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token?: string;
  invalid: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    invalid || !token ? "This reset link is invalid or expired." : null,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (result.error) {
      setError("This reset link is invalid or expired.");
      return;
    }
    router.replace("/sign-in?reset=complete");
  }

  return (
    <form className="product-auth-form" onSubmit={submit}>
      <h2>Choose a new password</h2>
      <label>
        <span>New password</span>
        <input
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          name="confirmation"
          required
          type="password"
        />
      </label>
      <div aria-live="polite" className="product-auth-error">
        {error}
      </div>
      <button disabled={!token || invalid} type="submit">
        Update password
      </button>
      <Link href="/sign-in">Return to sign in</Link>
    </form>
  );
}

export function CheckEmailForm({ email }: { email?: string }) {
  const [message, setMessage] = useState(
    "Check your inbox to verify your email.",
  );

  async function resend() {
    if (!email) return;
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    setMessage(
      result.error
        ? "We could not resend the email. Try again shortly."
        : "A fresh verification link was sent.",
    );
  }

  return (
    <div className="product-auth-form">
      <h2>Verify your email</h2>
      <p aria-live="polite">{message}</p>
      <button disabled={!email} onClick={resend} type="button">
        Resend verification email
      </button>
      <Link href="/sign-in">Return to sign in</Link>
    </div>
  );
}

export function AcceptInvitationForm({
  invitationId,
}: {
  invitationId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!invitationId) return;
    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });
    if (result.error) {
      setError("Sign in with the verified invited email, then try again.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="product-auth-form">
      <h2>Workspace invitation</h2>
      <div aria-live="polite" className="product-auth-error">
        {error}
      </div>
      <button disabled={!invitationId} onClick={accept} type="button">
        Accept invitation
      </button>
      <Link href="/sign-in">Sign in first</Link>
    </div>
  );
}
