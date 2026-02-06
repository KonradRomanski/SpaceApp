"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "../lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (value: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const raw = localStorage.getItem("cj-locale");
    if (raw === "pl" || raw === "en") {
      setLocaleState(raw);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cj-locale", locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((prev) => (prev === "en" ? "pl" : "en"))
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
