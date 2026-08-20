import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

/** `home` turns on the in-page nav and tells the bar it starts over the dark
 * hero stage; every other route keeps the page colours from the first pixel. */
export function Layout({ home, children }: { home: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <SiteHeader home={home} />
      {children}
      <SiteFooter />
    </div>
  );
}
