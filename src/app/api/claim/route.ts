import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { winnerId, userName, phone, address } = await req.json();

    if (!winnerId || !userName || !phone) {
      return NextResponse.json({ error: '請填寫完整資料' }, { status: 400 });
    }

    // Validate phone format (Taiwan mobile)
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: '請輸入正確的手機號碼格式 (09xxxxxxxx)' }, { status: 400 });
    }

    const winner = await prisma.winner.update({
      where: { id: winnerId },
      data: { userName, phone, address, status: 'confirmed' },
    });

    return NextResponse.json({ success: true, winner });
  } catch (error: unknown) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: '資料提交失敗，請稍後再試' }, { status: 500 });
  }
}
