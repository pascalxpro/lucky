import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { campaignId, type, targetId, deviceId } = await req.json();

    if (!campaignId || !type || !deviceId) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // Validate type
    if (!['visit', 'project_view'].includes(type)) {
      return NextResponse.json({ error: '無效的追蹤類型' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Deduplicate: same device + same type + same target within the same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.pageView.findFirst({
      where: {
        campaignId,
        type,
        targetId: targetId || null,
        deviceId,
        createdAt: { gte: today },
      },
    });

    if (existing) {
      // Already tracked today, skip
      return NextResponse.json({ success: true, duplicate: true });
    }

    await prisma.pageView.create({
      data: {
        campaignId,
        type,
        targetId: targetId || null,
        deviceId,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: '追蹤失敗' }, { status: 500 });
  }
}
