'use client';

import { useRouter } from 'next/navigation';
import { StudioAuthFlow } from '@/components/auth/StudioAuthFlow';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <StudioAuthFlow initialStep="register" onSuccess={() => router.push('/')} />
  );
}
