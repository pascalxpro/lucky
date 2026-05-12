import { prisma } from '@/lib/prisma';
import HomePage from '@/components/HomePage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const campaign = await prisma.campaign.findFirst({
    where: { isActive: true },
    include: {
      projects: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { votes: true } } } },
      banners: { orderBy: { sortOrder: 'asc' } },
      prizes: { where: { isConsolation: false }, orderBy: { sortOrder: 'asc' }, take: 4 },
    },
  });

  if (!campaign) {
    return (
      <div className="game-container">
        <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 900 }}>目前沒有進行中的活動</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>敬請期待下一場精彩活動！</p>
      </div>
    );
  }

  // Get maxVotesPerPerson setting
  const maxVotesSetting = await prisma.setting.findUnique({
    where: { campaignId_key: { campaignId: campaign.id, key: 'maxVotesPerPerson' } },
  });
  const maxVotesPerPerson = maxVotesSetting ? parseInt(maxVotesSetting.value, 10) : 0;

  // Get campaign details (活動說明)
  const detailsSetting = await prisma.setting.findUnique({
    where: { campaignId_key: { campaignId: campaign.id, key: 'campaignDetails' } },
  });
  const campaignDetails = detailsSetting?.value || '';

  // Get requireClaimInfo setting
  const claimInfoSetting = await prisma.setting.findUnique({
    where: { campaignId_key: { campaignId: campaign.id, key: 'requireClaimInfo' } },
  });
  const requireClaimInfo = claimInfoSetting ? claimInfoSetting.value !== 'false' : true;

  // Get branding settings
  const [logoSetting, companyNameSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { campaignId_key: { campaignId: campaign.id, key: 'logoUrl' } } }),
    prisma.setting.findUnique({ where: { campaignId_key: { campaignId: campaign.id, key: 'companyName' } } }),
  ]);

  return (
    <HomePage
      campaign={JSON.parse(JSON.stringify(campaign))}
      maxVotesPerPerson={maxVotesPerPerson}
      campaignDetails={campaignDetails}
      requireClaimInfo={requireClaimInfo}
      logoUrl={logoSetting?.value || ''}
      companyName={companyNameSetting?.value || ''}
    />
  );
}

