import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json({ success: true, data: { has_line: false, has_email: false, has_discord: false, tier: 'free' } });
  }
  return NextResponse.json({ success: true, data: { has_line: false, has_email: false, has_discord: false, tier: 'free' } });
}

export async function PATCH(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json({ success: true, data: { has_line: false, has_email: false, has_discord: false } });
  }
  return NextResponse.json({ success: true, data: { has_line: false, has_email: false, has_discord: false } });
}
