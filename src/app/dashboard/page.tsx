import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserPlanCount } from "@/lib/planLimits";
import DashboardUpgradeButton from "./DashboardUpgradeButton";
import UpgradeSuccessBanner from "./UpgradeSuccessBanner";
import NavigatorComingSoonBanner from "./NavigatorComingSoonBanner";
import BuildNewPlanButton from "./BuildNewPlanButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const firstName = user.firstName ?? "there";

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("id, stripe_subscription_status")
    .eq("clerk_id", user.id)
    .single();

  const isPlanner = userData?.stripe_subscription_status === "active";
  const plansCount = userData ? await getUserPlanCount(userData.id) : 0;
  const canCreatePlan = isPlanner || plansCount < 1;

  const plans = userData
    ? await supabaseAdmin
        .from("plans")
        .select("id, scenario, state, inputs, name, created_at")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const planList = plans.data ?? [];

  const scenarioLabels: Record<string, string> = {
    employed_long: "Employed 12+ months",
    employed_short: "Employed under 12 months",
    new_job: "Starting a new job",
    laid_off: "Laid off",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {params.upgraded === "true" && <UpgradeSuccessBanner />}

        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Hi, {firstName} 👋</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your current product tier:{" "}
              {isPlanner ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Planner
                </span>
              ) : (
                <span className="font-semibold text-slate-700">Explorer (free tier)</span>
              )}
            </p>
            {!isPlanner && (
              <div className="mt-3">
                <DashboardUpgradeButton />
              </div>
            )}
          </div>
          <BuildNewPlanButton
            canCreatePlan={canCreatePlan}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
          >
            Build new plan +
          </BuildNewPlanButton>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">My Leave Plans</h2>
            {planList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">You don&apos;t have any saved plans yet.</p>
                <BuildNewPlanButton
                  canCreatePlan={canCreatePlan}
                  className="mt-4 inline-block rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
                >
                  Build my first plan →
                </BuildNewPlanButton>
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
                            scenarioLabels[plan.scenario] ?? plan.scenario,
                          ].join(" · ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.state} &middot;{" "}
                          {new Date(plan.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
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
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">HR Resources</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <p className="text-sm text-slate-600">
                Download checklists to share with your HR team when requesting leave.
              </p>
              <a
                href="/checklists/Leavigation_HR_Checklist_California.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition"
              >
                California HR Checklist ↗
              </a>
              <a
                href="/checklists/Leavigation_HR_Checklist_AllStates.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                General (All States) HR Checklist ↗
              </a>
            </div>
          </section>
        </div>

        <NavigatorComingSoonBanner />
      </div>
    </main>
  );
}
