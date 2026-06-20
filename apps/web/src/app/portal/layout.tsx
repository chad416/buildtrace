import '../globals.css';

import type { ReactNode } from 'react';

type PortalLayoutProps = {
  readonly children: ReactNode;
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-stone-50 antialiased">{children}</body>
    </html>
  );
}
