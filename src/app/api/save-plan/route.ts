import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserPlanCount } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, email, scenario, state, inputs, name, planId } = body;

    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({ clerk_id: clerkId, email }, { onConflict: "clerk_id" });

    if (upsertError) {
      console.error("Upsert user error:", upsertError);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    const { data: userData, error: selectError } = await supabaseAdmin
      .from("users")
      .select("id, stripe_subscription_status")
      .eq("clerk_id", clerkId)
      .single();

    if (selectError) {
      console.error("Select user error:", selectError);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const isPlanner = userData.stripe_subscription_status === "active";

    if (planId) {
      const { data: existingPlan, error: existingPlanError } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("id", planId)
        .eq("user_id", userData.id)
        .maybeSingle();

      if (existingPlanError) {
        console.error("Select existing plan error:", existingPlanError);
        return NextResponse.json({ success: false, error: existingPlanError.message }, { status: 500 });
      }

      if (existingPlan) {
        const { data: planData, error: updateError } = await supabaseAdmin
          .from("plans")
          .update({ scenario, state, inputs, name })
          .eq("id", planId)
          .eq("user_id", userData.id)
          .select("id")
          .single();

        if (updateError) {
          console.error("Update plan error:", updateError);
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, planId: planData?.id, updated: true });
      }
    }

    if (!isPlanner) {
      const actualPlanCount = await getUserPlanCount(userData.id);
      if (actualPlanCount >= 1) {
        return NextResponse.json(
          { success: false, error: "plan_limit_reached" },
          { status: 403 }
        );
      }
    }

    const { data: planData, error: insertError } = await supabaseAdmin
      .from("plans")
      .insert({ user_id: userData.id, scenario, state, inputs, name })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert plan error:", insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    const newPlanCount = await getUserPlanCount(userData.id);
    const { error: countError } = await supabaseAdmin
      .from("users")
      .update({ plans_count: newPlanCount })
      .eq("id", userData.id);

    if (countError) {
      console.error("Update plans_count error:", countError);
    }

    return NextResponse.json({ success: true, planId: planData?.id, updated: false });
  } catch (err) {
    console.error("save-plan error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
