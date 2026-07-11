import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { clerkId, email } = await req.json();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Missing clerkId" }, { status: 400 });
    }

    const legal_agreement_accepted_at = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("users")
      .upsert(
        { clerk_id: clerkId, email: email ?? null, legal_agreement_accepted_at },
        { onConflict: "clerk_id" }
      );

    if (error) {
      console.error("accept-legal error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, legal_agreement_accepted_at });
  } catch (err) {
    console.error("accept-legal error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
