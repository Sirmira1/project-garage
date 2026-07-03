"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-[#FF6A13] px-4 py-2 text-sm font-semibold text-white print:hidden"
    >
      <Printer className="size-4" /> Print / Save as PDF
    </button>
  );
}
