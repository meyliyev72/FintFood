"use client";

import { useState, type ReactNode } from "react";

import { MobileBottomNav } from "./mobile-bottom-nav";
import { Navbar } from "./navbar";
import { UtilityPanel } from "./utility-panel";

/**
 * Client chrome that owns the utility panel's open state.
 *
 * Both the navbar (desktop) and the mobile bottom bar open the same panel,
 * so the state has to live above them. Kept as thin a wrapper as possible so
 * the page content underneath stays a server component.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  return (
    <>
      <Navbar onOpenUtilities={() => setUtilitiesOpen(true)} />
      {children}
      <MobileBottomNav onOpenUtilities={() => setUtilitiesOpen(true)} />
      <UtilityPanel open={utilitiesOpen} onOpenChange={setUtilitiesOpen} />
    </>
  );
}
