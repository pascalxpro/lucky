import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { drawPrize } from '@/lib/lottery';

export async function POST(req: NextRequest) {
  try {
    const { campaignId, deviceId } = await req.json();

    if (!campaignId || !deviceId) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // Get all prizes for this campaign
    const prizes = await prisma.prize.findMany({
      where: { campaignId },
      orderBy: { sortOrder: 'asc' },
    });

    if (prizes.length === 0) {
      return NextResponse.json({ error: '此活動尚未設定獎品' }, { status: 404 });
    }

    // Draw using lottery engine
    const result = drawPrize(prizes.map(p => ({
      id: p.id,
      name: p.name,
      probability: p.probability,
      remaining: p.remaining,
      isConsolation: p.isConsolation,
    })));

    // Create winner record and decrement stock in a transaction
    const winner = await prisma.$transaction(async (tx) => {
      // Decrement prize stock if not consolation with unlimited stock
      if (result.prizeId) {
        const prize = await tx.prize.findUnique({ where: { id: result.prizeId } });
        if (prize && !prize.isConsolation && prize.remaining > 0) {
          await tx.prize.update({
            where: { id: result.prizeId },
            data: { remaining: { decrement: 1 } },
          });
        }
      }

      // Create winner record
      return tx.winner.create({
        data: {
          campaignId,
          prizeId: result.prizeId || prizes[prizes.length - 1].id,
          deviceId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      winnerId: winner.id,
      prizeId: result.prizeId,
      prizeName: result.prizeName,
      isWin: result.isWin,
      isConsolation: result.isConsolation,
    });
  } catch (error: unknown) {
    console.error('Lottery error:', error);
    return NextResponse.json({ error: '抽獎失敗，請稍後再試' }, { status: 500 });
  }
}
