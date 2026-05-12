'use server';

import { prisma } from '@/lib/prisma';

// ============ Campaign Actions ============

export async function getActiveCampaign() {
  return prisma.campaign.findFirst({
    where: { isActive: true },
    include: {
      projects: { orderBy: { sortOrder: 'asc' } },
      prizes: { orderBy: { sortOrder: 'asc' } },
      banners: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function getCampaigns() {
  return prisma.campaign.findMany({
    include: {
      _count: { select: { votes: true, winners: true, projects: true, prizes: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCampaign(data: { name: string; description?: string; gameMode?: string }) {
  return prisma.campaign.create({ data });
}

export async function updateCampaign(id: string, data: { name?: string; description?: string; gameMode?: string; isActive?: boolean }) {
  // If activating this campaign, deactivate others
  if (data.isActive) {
    await prisma.campaign.updateMany({ where: { id: { not: id } }, data: { isActive: false } });
  }
  return prisma.campaign.update({ where: { id }, data });
}

export async function deleteCampaign(id: string) {
  return prisma.campaign.delete({ where: { id } });
}

// ============ Project Actions ============

export async function getProjects(campaignId: string) {
  return prisma.project.findMany({
    where: { campaignId },
    include: { _count: { select: { votes: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createProject(data: { campaignId: string; name: string; description?: string; imageUrl?: string; images?: string }) {
  const maxOrder = await prisma.project.aggregate({ where: { campaignId: data.campaignId }, _max: { sortOrder: true } });
  return prisma.project.create({ data: { ...data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
}

export async function updateProject(id: string, data: { name?: string; description?: string; imageUrl?: string; images?: string; sortOrder?: number }) {
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

export async function reorderProjects(items: { id: string; sortOrder: number }[]) {
  const ops = items.map(item => prisma.project.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }));
  return prisma.$transaction(ops);
}

// ============ Prize Actions ============

export async function getPrizes(campaignId: string) {
  return prisma.prize.findMany({
    where: { campaignId },
    include: { _count: { select: { winners: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createPrize(data: { campaignId: string; name: string; totalStock: number; remaining: number; probability: number; isConsolation?: boolean; imageUrl?: string }) {
  const maxOrder = await prisma.prize.aggregate({ where: { campaignId: data.campaignId }, _max: { sortOrder: true } });
  return prisma.prize.create({ data: { ...data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
}

export async function updatePrize(id: string, data: { name?: string; totalStock?: number; remaining?: number; probability?: number; isConsolation?: boolean; imageUrl?: string }) {
  return prisma.prize.update({ where: { id }, data });
}

export async function deletePrize(id: string) {
  return prisma.prize.delete({ where: { id } });
}

// ============ Banner Actions ============

export async function getBanners(campaignId: string) {
  return prisma.banner.findMany({ where: { campaignId }, orderBy: { sortOrder: 'asc' } });
}

export async function createBanner(data: { campaignId: string; imageUrl: string; linkUrl?: string }) {
  const maxOrder = await prisma.banner.aggregate({ where: { campaignId: data.campaignId }, _max: { sortOrder: true } });
  return prisma.banner.create({ data: { ...data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 } });
}

export async function updateBanner(id: string, data: { imageUrl?: string; linkUrl?: string; sortOrder?: number }) {
  return prisma.banner.update({ where: { id }, data });
}

export async function deleteBanner(id: string) {
  return prisma.banner.delete({ where: { id } });
}

export async function reorderBanners(orderedIds: string[]) {
  const updates = orderedIds.map((id, i) =>
    prisma.banner.update({ where: { id }, data: { sortOrder: i } })
  );
  return prisma.$transaction(updates);
}

// ============ Winner Actions ============

export async function getWinners(campaignId?: string) {
  return prisma.winner.findMany({
    where: campaignId ? { campaignId } : {},
    include: { prize: true, campaign: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateWinnerStatus(id: string, status: string) {
  return prisma.winner.update({ where: { id }, data: { status } });
}

export async function updateWinnerInfo(id: string, data: { userName?: string; phone?: string; address?: string }) {
  return prisma.winner.update({ where: { id }, data });
}

export async function deleteWinner(id: string) {
  return prisma.winner.delete({ where: { id } });
}

// ============ Setting Actions ============

export async function getSetting(campaignId: string, key: string) {
  const setting = await prisma.setting.findUnique({ where: { campaignId_key: { campaignId, key } } });
  return setting?.value;
}

export async function setSetting(campaignId: string, key: string, value: string) {
  return prisma.setting.upsert({
    where: { campaignId_key: { campaignId, key } },
    update: { value },
    create: { campaignId, key, value },
  });
}

// ============ Dashboard Stats ============

export async function getDashboardStats(campaignId: string) {
  const [totalVotes, uniqueDevices, totalWinners, missCount, projects, prizes] = await Promise.all([
    prisma.vote.count({ where: { campaignId } }),
    prisma.vote.groupBy({ by: ['deviceId'], where: { campaignId } }).then(r => r.length),
    prisma.winner.count({ where: { campaignId, prize: { isConsolation: false } } }),
    prisma.winner.count({ where: { campaignId, prize: { isConsolation: true } } }),
    prisma.project.findMany({
      where: { campaignId },
      include: { _count: { select: { votes: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.prize.findMany({
      where: { campaignId },
      include: { _count: { select: { winners: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  // Daily vote trend (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentVotes = await prisma.vote.findMany({
    where: { campaignId, createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true },
  });

  const dailyTrend: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyTrend[d.toISOString().split('T')[0]] = 0;
  }
  recentVotes.forEach(v => {
    const day = v.createdAt.toISOString().split('T')[0];
    if (dailyTrend[day] !== undefined) dailyTrend[day]++;
  });

  const total = totalWinners + missCount;
  const winRate = total > 0 ? ((totalWinners / total) * 100).toFixed(1) : '0';

  return {
    totalVotes,
    uniqueDevices,
    totalWinners,
    missCount,
    winRate,
    dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({ date, count })),
    projectVotes: projects.map(p => ({ name: p.name, votes: p._count.votes })),
    prizeInventory: prizes.map(p => ({
      name: p.name,
      totalStock: p.totalStock,
      remaining: p.remaining,
      used: p._count.winners,
      isConsolation: p.isConsolation,
    })),
  };
}

// ============ Auth ============

export async function verifyAdmin(username: string, password: string) {
  const bcrypt = await import('bcryptjs');
  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? { id: user.id, username: user.username } : null;
}
