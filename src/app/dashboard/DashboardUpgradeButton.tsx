"use client";

import { useUser } from "@clerk/nextjs";

export default function DashboardUpgradeButton() {
  const { user } = useUser();

  async function handleUpgrade() {
    if (!user) return;
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <button
      type="button"
      onClick={handleUpgrade}
      className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
    >
      Upgrade to Planner
    </button>
  );
}
