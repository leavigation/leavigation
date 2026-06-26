import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function WelcomePage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {firstName}!</h1>
        <p className="mt-3 text-sm text-slate-600">Your Leavigation account is ready. Let&apos;s build your personalized parental leave plan.</p>
        <div className="mt-8 space-y-3">
          <Link href="/plan" className="block w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition">
            Build my leave plan →
          </Link>
          <Link href="/dashboard" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Go to my dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
