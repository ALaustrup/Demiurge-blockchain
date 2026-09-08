'use client';

import { Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudioAuthFlow } from '@/components/auth/StudioAuthFlow';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const initialStep = stepParam === 'register' ? 'register' : 'login';

  return (
    <StudioAuthFlow initialStep={initialStep} onSuccess={() => router.push('/')} />
  );
}

function SuspenseWrapper({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export default function LoginPage() {
  return (
    <SuspenseWrapper
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-void text-text-tertiary font-mono text-sm">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </SuspenseWrapper>
  );
}
