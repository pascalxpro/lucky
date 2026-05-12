import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { projectId, campaignId, deviceId } = await req.json();

    if (!projectId || !campaignId || !deviceId) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // Check if device already voted for this project
    const existing = await prisma.vote.findUnique({
      where: { projectId_deviceId: { projectId, deviceId } },
    });

    if (existing) {
      return NextResponse.json({ error: '您已經為此作品投過票了', alreadyVoted: true }, { status: 409 });
    }

    // ── Check max votes per person ──
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

    // Get IP address
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Create vote
    const vote = await prisma.vote.create({
      data: { projectId, campaignId, deviceId, ipAddress },
    });

    // Get updated vote count
    const voteCount = await prisma.vote.count({ where: { projectId } });

    // Get user's total votes in this campaign
    const userTotalVotes = await prisma.vote.count({
      where: { campaignId, deviceId },
    });

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
