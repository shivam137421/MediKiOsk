'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KioskRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/patient');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500">
      Redirecting to Patient Care Portal...
    </div>
  );
}
