import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Hi, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-600">Your saved leave plans will appear here.</p>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">You don&apos;t have any saved plans yet.</p>
          <Link href="/plan" className="mt-4 inline-block rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
            Build my first plan →
          </Link>
        </div>
      </div>
    </main>
  );
}
