import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExplorerAccess } from "@/lib/explorerAccess";
import { getLeaveGuideStateBySlug, LEAVE_GUIDE_STATES } from "@/lib/leaveGuideStateModel";
import LeaveGuideClient from "../LeaveGuideClient";

type Props = { params: Promise<{ stateSlug: string }> };

export function generateStaticParams() {
  return LEAVE_GUIDE_STATES.map((s) => ({ stateSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params;
  const s = getLeaveGuideStateBySlug(stateSlug);
  if (!s) {
    return { title: "Leave guide | Leavigation" };
  }
  return {
    title: `How Parental Leave Works in ${s.name} | Leavigation`,
    description: `Understand parental leave in ${s.name}: job protection, paid family leave, and short term disability explained simply. Build your personalized leave plan free.`,
  };
}

export default async function LeaveGuideStatePage({ params }: Props) {
  const { stateSlug } = await params;
  const s = getLeaveGuideStateBySlug(stateSlug);
  if (!s) notFound();
  const access = await getExplorerAccess();
  return <LeaveGuideClient initialSlug={stateSlug} initialAccess={access} />;
}
