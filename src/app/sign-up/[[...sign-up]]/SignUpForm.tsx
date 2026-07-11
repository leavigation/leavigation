"use client";

import Link from "next/link";
import { useAuth, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function resolveRedirectPath(redirectTo?: string): string {
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/welcome";
}

async function saveLegalAgreement(clerkId: string, email: string) {
  await fetch("/api/accept-legal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkId, email }),
  });
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

function LegalCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
        />
        <span className="text-xs text-slate-600 leading-relaxed">
          I agree to the{" "}
          <Link href="/legal#terms" className="text-sky-600 underline hover:text-sky-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal#privacy" className="text-sky-600 underline hover:text-sky-700">
            Privacy Policy
          </Link>{" "}
          and understand that Leavigation provides general leave planning information only and is not legal or financial advice.
        </span>
      </label>
    </div>
  );
}

function ExistingUserLegalGate({
  redirectReason,
  redirectTo,
}: {
  redirectReason?: string;
  redirectTo?: string;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const clerkId = user?.id;
    if (!clerkId) return;
    async function checkAgreement() {
      try {
        const res = await fetch(`/api/legal-agreement-status?clerkId=${clerkId}`);
        const data = await res.json();
        if (data.accepted) {
          router.push(resolveRedirectPath(redirectTo));
          return;
        }
      } catch {
        // If the check fails, show the gate
      }
      setChecking(false);
    }
    checkAgreement();
  }, [user, router, redirectTo]);

  async function handleAccept() {
    if (!user || !legalAgreed) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/accept-legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to save agreement");
      router.push(resolveRedirectPath(redirectTo));
    } catch {
      setError("Unable to save your agreement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {redirectReason === "leave-education" && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Create your free account to access leave education for your state.
        </div>
      )}
      <h1 className="text-xl font-semibold text-slate-900">Accept terms to continue</h1>
      <p className="mt-2 text-sm text-slate-600">
        Please review and accept our terms before using Leavigation.
      </p>
      <div className="mt-6 space-y-4">
        <LegalCheckbox checked={legalAgreed} onChange={setLegalAgreed} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="button"
          onClick={handleAccept}
          disabled={!legalAgreed || submitting}
          className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default function SignUpForm({
  redirectReason,
  redirectTo,
}: {
  redirectReason?: string;
  redirectTo?: string;
}) {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (isSignedIn) {
    return <ExistingUserLegalGate redirectReason={redirectReason} redirectTo={redirectTo} />;
  }

  const isVerifying =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const isLoading = fetchStatus === "fetching";

  const fieldError =
    errors.fields.emailAddress ??
    errors.fields.password ??
    errors.fields.firstName ??
    errors.fields.lastName ??
    errors.fields.code;
  const displayError =
    error || fieldError?.message || errors.global?.[0]?.message || null;

  async function finishSignUp(emailAddress: string) {
    const { error: finalizeError } = await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        const clerkId = signUp.createdUserId ?? session?.user?.id;
        if (clerkId) {
          await saveLegalAgreement(clerkId, emailAddress);
        }
        const url = decorateUrl(resolveRedirectPath(redirectTo));
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
    if (finalizeError) {
      setError(finalizeError.message ?? "Unable to complete sign-up.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!legalAgreed) return;

    setError("");
    const { error: passwordError } = await signUp.password({
      emailAddress: email,
      password,
      firstName,
      lastName,
      legalAccepted: true,
    });

    if (passwordError) {
      setError(passwordError.message ?? "Something went wrong. Please try again.");
      return;
    }

    if (signUp.status === "complete") {
      await finishSignUp(email);
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError(sendError.message ?? "Unable to send verification code.");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!legalAgreed) return;

    setError("");
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
    if (verifyError) {
      setError(verifyError.message ?? "Invalid verification code.");
      return;
    }

    if (signUp.status === "complete") {
      await finishSignUp(email);
    }
  }

  if (isVerifying) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the verification code sent to{" "}
          <span className="font-medium">{signUp.emailAddress ?? email}</span>.
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`mt-2 ${inputClassName}`}
              placeholder="123456"
              required
            />
          </div>
          {displayError && <p className="text-sm text-rose-600">{displayError}</p>}
          <button
            type="submit"
            disabled={!legalAgreed || isLoading || !code.trim()}
            className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Verifying…" : "Verify email"}
          </button>
          <button
            type="button"
            onClick={() => signUp.verifications.sendEmailCode()}
            disabled={isLoading}
            className="w-full text-sm text-sky-600 hover:text-sky-700 disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {redirectReason === "leave-education" && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Create your free account to access leave education for your state.
        </div>
      )}
      <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-2 text-sm text-slate-600">Sign up to save and access your leave plan.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`mt-2 ${inputClassName}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`mt-2 ${inputClassName}`}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-2 ${inputClassName}`}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-2 ${inputClassName}`}
            required
            autoComplete="new-password"
          />
        </div>
        <LegalCheckbox checked={legalAgreed} onChange={setLegalAgreed} />
        {!legalAgreed && (
          <p className="text-xs text-slate-400">Please agree to the terms above to create your account.</p>
        )}
        {displayError && <p className="text-sm text-rose-600">{displayError}</p>}
        <div id="clerk-captcha" />
        <button
          type="submit"
          disabled={!legalAgreed || isLoading}
          className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-sky-600 hover:text-sky-700">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
