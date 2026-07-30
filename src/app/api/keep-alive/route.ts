import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("keep-alive error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
