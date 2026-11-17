"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Contest } from "@/lib/domjudge/types";

export interface ContestInfo {
  contest: Contest;
  teamId: string;
  teamName: string;
}

const Ctx = createContext<ContestInfo | null>(null);

export function ContestProvider({
  value,
  children,
}: {
  value: ContestInfo;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContestInfo(): ContestInfo {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useContestInfo harus dipakai di dalam <ContestProvider>.");
  return v;
}
