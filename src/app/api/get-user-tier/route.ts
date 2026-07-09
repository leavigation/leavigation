import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const clerkId = req.nextUrl.searchParams.get("clerkId");
  if (!clerkId) return NextResponse.json({ tier: "free" });
  const { data } = await supabaseAdmin
    .from("users")
    .select("stripe_subscription_status")
    .eq("clerk_id", clerkId)
    .single();
  const tier = data?.stripe_subscription_status === "active" ? "planner" : "free";
  return NextResponse.json({ tier });
}
