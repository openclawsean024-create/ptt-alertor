import { NextRequest, NextResponse } from 'next/server';

// Stripe portal — not available in bypass/demo mode
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json(
      { error: 'Stripe portal not available in demo mode' },
      { status: 403 }
    );
  }
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
