"use client";

import type { ReactNode } from "react";

export default function WaitlistButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  function openWaitlist() {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).beehiiv) {
      (window as unknown as Record<string, { open: () => void }>).beehiiv.open();
    }
  }

  return (
    <button type="button" onClick={openWaitlist} className={className}>
      {children}
    </button>
  );
}
