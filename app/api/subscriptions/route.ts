import { NextRequest, NextResponse } from 'next/server';

async function getSafeUserId() {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return 'bypass-user';
  return null;
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json({ success: true, data: [], source: 'bypass' });
  }
  const userId = await getSafeUserId();
  if (!userId) return NextResponse.json({ success: true, data: [] });
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      data: {
        id: 'bypass-sub-1',
        board_name: body.board_name || 'Gossiping',
        keywords: body.keywords || [{ text: '八卦', logic: 'include' }],
        notify_line: false,
        notify_email: true,
        notify_discord: false,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
  }
  const userId = await getSafeUserId();
  if (!userId) return NextResponse.json({ success: true, data: [] });
  return NextResponse.json({ success: true, data: [] });
}
