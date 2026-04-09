'use client';

import dynamic from 'next/dynamic';

const SignInComponent = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.SignIn),
  { ssr: false, loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div> }
);

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInComponent />
    </div>
  );
}
