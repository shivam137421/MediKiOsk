'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TriageRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500">
      Redirecting to Admin Triage & Assignment Center...
    </div>
  );
}
