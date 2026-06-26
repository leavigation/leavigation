import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName ?? "there";

  // Fetch user's plans from Supabase
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("id, tier")
    .eq("clerk_id", user.id)
    .single();

  const plans = userData ? await supabaseAdmin
    .from("plans")
    .select("id, scenario, state, inputs, name, created_at")
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false }) : { data: [] };

  const planList = plans.data ?? [];

  const scenarioLabels: Record<string, string> = {
    employed_long: "Employed 12+ months",
    employed_short: "Employed under 12 months",
    new_job: "Starting a new job",
    laid_off: "Laid off",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Hi, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">Your saved leave plans</p>
          </div>
          <Link
            href="/plan"
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
          >
            Build new plan +
          </Link>
        </header>

        {planList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">You don&apos;t have any saved plans yet.</p>
            <Link
              href="/plan"
              className="mt-4 inline-block rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
            >
              Build my first plan →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {planList.map((plan: {
              id: string;
              scenario: string;
              state: string;
              inputs: Record<string, unknown>;
              name: string | null;
              created_at: string;
            }) => (
              <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {plan.name || [
                        plan.state,
                        scenarioLabels[plan.scenario] ?? plan.scenario
                      ].join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.state} &middot; {new Date(plan.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link
                    href={`/plan?planId=${plan.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    View plan →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
