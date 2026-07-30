"use client";

import type { CSSProperties, ReactNode } from "react";
import { openBeehiivWaitlist } from "@/lib/beehiiv";

export default function WaitlistButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={openBeehiivWaitlist} className={className} style={style}>
      {children}
    </button>
  );
}
