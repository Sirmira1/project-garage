"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const GOTO: Record<string, string> = {
  d: "/dashboard",
  g: "/garage",
  a: "/analytics",
  s: "/settings",
};

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const awaitingG = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (awaitingG.current) {
        awaitingG.current = false;
        if (timer.current) clearTimeout(timer.current);
        const dest = GOTO[key];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      if (key === "g") {
        awaitingG.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          awaitingG.current = false;
        }, 1200);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
