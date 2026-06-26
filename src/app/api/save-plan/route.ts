import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, email, scenario, state, inputs, name } = body;

    // Upsert user
    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({ clerk_id: clerkId, email }, { onConflict: "clerk_id" });

    if (upsertError) {
      console.error("Upsert user error:", upsertError);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    // Get user record
    const { data: userData, error: selectError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();

    if (selectError) {
      console.error("Select user error:", selectError);
      return NextResponse.json({ success: false, error: selectError.message }, { status: 500 });
    }

    if (userData) {
      const { data: planData, error: insertError } = await supabaseAdmin
        .from("plans")
        .insert({ user_id: userData.id, scenario, state, inputs, name })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert plan error:", insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, planId: planData?.id });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("save-plan error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
