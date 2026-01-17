/**
 * ============================================================
 * 📄 FILE: app/pay/page.tsx
 * ============================================================
 */

import { Suspense } from 'react';
import PayClient from './pay-client';

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-sm text-muted-foreground">
          Loading payment page…
        </div>
      }
    >
      <PayClient />
    </Suspense>
  );
}
