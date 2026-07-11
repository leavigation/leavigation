import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const clerkId = req.nextUrl.searchParams.get("clerkId");
  if (!clerkId) return NextResponse.json({ accepted: false });

  const { data } = await supabaseAdmin
    .from("users")
    .select("legal_agreement_accepted_at")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  return NextResponse.json({ accepted: !!data?.legal_agreement_accepted_at });
}
