import { NextRequest, NextResponse } from 'next/server';

async function getSafeUserId() {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return 'bypass-user';
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      data: { id, ...body, updated_at: new Date().toISOString() },
    });
  }
  const userId = await getSafeUserId();
  if (!userId) return NextResponse.json({ success: true, data: {} });
  return NextResponse.json({ success: true, data: {} });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.json({ success: true });
  }
  const userId = await getSafeUserId();
  if (!userId) return NextResponse.json({ success: true });
  return NextResponse.json({ success: true });
}
