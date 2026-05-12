import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('admin1234', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' }, update: {},
    create: { username: 'admin', passwordHash },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: 'demo-campaign' }, update: {},
    create: {
      id: 'demo-campaign', name: '2026 年度人氣票選活動',
      description: '選出您最喜愛的作品，投票即可參加幸運抽獎！',
      gameMode: 'wheel', isActive: true,
    },
  });

  const projects = [
    { id: 'proj-1', name: '星空幻境', description: '夢幻般的星空藝術創作', sortOrder: 1 },
    { id: 'proj-2', name: '海洋之心', description: '深海靈感的立體裝置藝術', sortOrder: 2 },
    { id: 'proj-3', name: '城市脈動', description: '捕捉都市生活的節奏與能量', sortOrder: 3 },
    { id: 'proj-4', name: '花語呢喃', description: '花卉主題的水彩創作', sortOrder: 4 },
    { id: 'proj-5', name: '光影交織', description: '光影技術的沉浸式互動體驗', sortOrder: 5 },
    { id: 'proj-6', name: '未來城邦', description: '科幻風格的建築設計概念', sortOrder: 6 },
  ];
  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: { ...p, campaignId: campaign.id } });
  }

  const prizes = [
    { id: 'prize-1', name: '頭獎 - iPhone 16 Pro', totalStock: 1, remaining: 1, probability: 0.5, sortOrder: 1 },
    { id: 'prize-2', name: '二獎 - AirPods Pro', totalStock: 3, remaining: 3, probability: 2, sortOrder: 2 },
    { id: 'prize-3', name: '三獎 - 星巴克禮券 $500', totalStock: 10, remaining: 10, probability: 5, sortOrder: 3 },
    { id: 'prize-4', name: '四獎 - 精美小禮物', totalStock: 50, remaining: 50, probability: 15, sortOrder: 4 },
    { id: 'prize-5', name: '安慰獎 - 折價券 $50', totalStock: 999, remaining: 999, probability: 27.5, isConsolation: true, sortOrder: 5 },
    { id: 'prize-no', name: '再接再厲', totalStock: 99999, remaining: 99999, probability: 50, isConsolation: true, sortOrder: 6 },
  ];
  for (const p of prizes) {
    await prisma.prize.upsert({ where: { id: p.id }, update: {}, create: { ...p, campaignId: campaign.id } });
  }

  const banners = [
    { id: 'banner-1', imageUrl: '/images/banners/banner1.jpg', linkUrl: '#vote', sortOrder: 1 },
    { id: 'banner-2', imageUrl: '/images/banners/banner2.jpg', linkUrl: '#prizes', sortOrder: 2 },
  ];
  for (const b of banners) {
    await prisma.banner.upsert({ where: { id: b.id }, update: {}, create: { ...b, campaignId: campaign.id } });
  }

  console.log('✅ Seed data created successfully');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
