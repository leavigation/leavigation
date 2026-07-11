import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import PlanPageClient from "./PlanPageClient";

export default async function PlanPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-up?redirect=/plan");
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("legal_agreement_accepted_at")
    .eq("clerk_id", userId)
    .single();

  if (!data?.legal_agreement_accepted_at) {
    redirect("/sign-up?redirect=/plan");
  }

  return <PlanPageClient />;
}
