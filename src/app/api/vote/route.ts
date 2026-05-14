import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { projectId, campaignId, deviceId } = await req.json();

    if (!projectId || !campaignId || !deviceId) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // Get IP address
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // ── Layer 1: Device fingerprint check ──
    const existing = await prisma.vote.findUnique({
      where: { projectId_deviceId: { projectId, deviceId } },
    });

    if (existing) {
      return NextResponse.json({ error: '您已經為此作品投過票了', alreadyVoted: true }, { status: 409 });
    }

    // ── Layer 2: Max votes per person (device) ──
    const maxVotesSetting = await prisma.setting.findUnique({
      where: { campaignId_key: { campaignId, key: 'maxVotesPerPerson' } },
    });
    const maxVotes = maxVotesSetting ? parseInt(maxVotesSetting.value, 10) : 0; // 0 = unlimited

    if (maxVotes > 0) {
      const currentVotes = await prisma.vote.count({
        where: { campaignId, deviceId },
      });
      if (currentVotes >= maxVotes) {
        return NextResponse.json({
          error: `您已達到投票上限（${maxVotes} 票）`,
          limitReached: true,
          maxVotes,
          currentVotes,
        }, { status: 429 });
      }
    }

    // ── Layer 3: IP-based rate limiting ──
    const maxVotesPerIPSetting = await prisma.setting.findUnique({
      where: { campaignId_key: { campaignId, key: 'maxVotesPerIP' } },
    });
    const maxVotesPerIP = maxVotesPerIPSetting ? parseInt(maxVotesPerIPSetting.value, 10) : 0; // 0 = unlimited

    if (maxVotesPerIP > 0 && ipAddress !== 'unknown') {
      const ipVotes = await prisma.vote.count({
        where: { campaignId, ipAddress },
      });
      if (ipVotes >= maxVotesPerIP) {
        return NextResponse.json({
          error: `此網路環境已達到投票上限（${maxVotesPerIP} 票），請嘗試使用其他網路`,
          ipLimitReached: true,
        }, { status: 429 });
      }
    }

    // ── Create vote ──
    const vote = await prisma.vote.create({
      data: { projectId, campaignId, deviceId, ipAddress },
    });

    // Get updated counts
    const [voteCount, userTotalVotes] = await Promise.all([
      prisma.vote.count({ where: { projectId } }),
      prisma.vote.count({ where: { campaignId, deviceId } }),
    ]);

    return NextResponse.json({
      success: true,
      voteId: vote.id,
      voteCount,
      userTotalVotes,
      maxVotes: maxVotes || null,
      remaining: maxVotes > 0 ? maxVotes - userTotalVotes : null,
    });
  } catch (error: unknown) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: '投票失敗，請稍後再試' }, { status: 500 });
  }
}
