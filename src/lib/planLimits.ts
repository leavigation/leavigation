import { supabaseAdmin } from "@/lib/supabase";

export async function getUserPlanCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("plans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("getUserPlanCount error:", error);
    return 0;
  }

  return count ?? 0;
}
