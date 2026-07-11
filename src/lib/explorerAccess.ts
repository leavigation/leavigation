import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export type ExplorerAccessState = {
  isSignedIn: boolean;
  hasExplorerAccess: boolean;
};

export async function getExplorerAccess(): Promise<ExplorerAccessState> {
  const { userId } = await auth();
  if (!userId) {
    return { isSignedIn: false, hasExplorerAccess: false };
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("legal_agreement_accepted_at")
    .eq("clerk_id", userId)
    .maybeSingle();

  return {
    isSignedIn: true,
    hasExplorerAccess: !!data?.legal_agreement_accepted_at,
  };
}

export async function requireExplorerAccess() {
  const { isSignedIn, hasExplorerAccess } = await getExplorerAccess();
  if (!isSignedIn || !hasExplorerAccess) {
    redirect("/sign-up?reason=leave-education");
  }
}
