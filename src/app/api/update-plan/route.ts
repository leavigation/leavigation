import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  try {
    const { planId, name } = await req.json();
    const { error } = await supabaseAdmin
      .from("plans")
      .update({ name })
      .eq("id", planId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-plan error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
