"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LeavigationLogo() {
  const [logoError, setLogoError] = useState(false);

  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      {logoError ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-400 text-sm font-bold text-white">
          L
        </div>
      ) : (
        <Image
          src="/logo.png"
          alt="Leavigation logo"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          onError={() => setLogoError(true)}
        />
      )}
      <span className="text-lg font-semibold tracking-tight text-slate-900">Leavigation</span>
    </Link>
  );
}
