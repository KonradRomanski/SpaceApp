"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type VerifiedContextValue = {
  verified: boolean;
  setVerified: (value: boolean) => void;
  toggle: () => void;
};

const VerifiedContext = createContext<VerifiedContextValue | null>(null);

export function VerifiedProvider({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("cj-verified");
    if (raw === null) return;
    setVerified(raw === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("cj-verified", String(verified));
  }, [verified]);

  const value = useMemo(
    () => ({
      verified,
      setVerified,
      toggle: () => setVerified((prev) => !prev)
    }),
    [verified]
  );

  return <VerifiedContext.Provider value={value}>{children}</VerifiedContext.Provider>;
}

export function useVerified() {
  const ctx = useContext(VerifiedContext);
  if (!ctx) {
    throw new Error("useVerified must be used within VerifiedProvider");
  }
  return ctx;
}
