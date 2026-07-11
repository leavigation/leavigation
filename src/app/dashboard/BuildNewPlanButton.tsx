"use client";

import Link from "next/link";
import { useState } from "react";
import PlanLimitModal from "@/app/components/PlanLimitModal";

export default function BuildNewPlanButton({
  canCreatePlan,
  className,
  children,
}: {
  canCreatePlan: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const [showModal, setShowModal] = useState(false);

  if (canCreatePlan) {
    return (
      <Link href="/plan" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setShowModal(true)} className={className}>
        {children}
      </button>
      <PlanLimitModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
