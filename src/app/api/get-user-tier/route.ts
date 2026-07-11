import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserPlanCount } from "@/lib/planLimits";

export async function GET(req: NextRequest) {
  const clerkId = req.nextUrl.searchParams.get("clerkId");
  if (!clerkId) {
    return NextResponse.json({ tier: "none", plansCount: 0, canCreatePlan: false });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, stripe_subscription_status, legal_agreement_accepted_at")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  const isPlanner = data?.stripe_subscription_status === "active";
  const hasExplorerAccess = !!data?.legal_agreement_accepted_at;
  const plansCount = data?.id ? await getUserPlanCount(data.id) : 0;

  const tier = isPlanner ? "planner" : hasExplorerAccess ? "explorer" : "none";
  const canCreatePlan = isPlanner || plansCount < 1;

  return NextResponse.json({ tier, plansCount, canCreatePlan });
}
