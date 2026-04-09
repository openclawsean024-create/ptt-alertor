'use client';

import dynamic from 'next/dynamic';

const SignUpComponent = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignUp),
  { ssr: false, loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div> }
);

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUpComponent />
    </div>
  );
}
