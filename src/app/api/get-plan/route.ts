import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const planId = req.nextUrl.searchParams.get("planId");
    if (!planId) return NextResponse.json({ error: "No plan ID" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ plan: data });
  } catch (err) {
    console.error("get-plan error:", err);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
