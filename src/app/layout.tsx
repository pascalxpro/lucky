import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { THEME_PRESETS, themeToCSS } from "@/lib/themes";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const activeCampaign = await prisma.campaign.findFirst({ where: { isActive: true } });
    if (activeCampaign) {
      const siteNameSetting = await prisma.setting.findUnique({
        where: { campaignId_key: { campaignId: activeCampaign.id, key: 'siteName' } },
      });
      const faviconSetting = await prisma.setting.findUnique({
        where: { campaignId_key: { campaignId: activeCampaign.id, key: 'faviconUrl' } },
      });
      return {
        title: siteNameSetting?.value || '互動投票抽獎 | Riiqi Lucky',
        description: '投下您神聖的一票，參加幸運抽獎，贏取豐富大獎！',
        keywords: '投票, 抽獎, 轉盤, 刮刮樂, 拉霸, 幸運抽獎',
        icons: faviconSetting?.value ? { icon: faviconSetting.value } : undefined,
      };
    }
  } catch {}
  return {
    title: '互動投票抽獎 | Riiqi Lucky',
    description: '投下您神聖的一票，參加幸運抽獎，贏取豐富大獎！',
    keywords: '投票, 抽獎, 轉盤, 刮刮樂, 拉霸, 幸運抽獎',
  };
}

async function getThemeCSS(): Promise<{ cssVars: string; googleFontUrl: string }> {
  try {
    const activeCampaign = await prisma.campaign.findFirst({ where: { isActive: true } });
    if (!activeCampaign) return { cssVars: '', googleFontUrl: '' };

    const themeIdSetting = await prisma.setting.findUnique({
      where: { campaignId_key: { campaignId: activeCampaign.id, key: 'themeId' } },
    });
    const themeId = themeIdSetting?.value || 'purple-gold';
    const theme = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[2];

    // Read custom overrides
    const [headingScale, bodySize, cardRadius, customFont] = await Promise.all([
      prisma.setting.findUnique({ where: { campaignId_key: { campaignId: activeCampaign.id, key: 'headingScale' } } }),
      prisma.setting.findUnique({ where: { campaignId_key: { campaignId: activeCampaign.id, key: 'bodySize' } } }),
      prisma.setting.findUnique({ where: { campaignId_key: { campaignId: activeCampaign.id, key: 'cardRadius' } } }),
      prisma.setting.findUnique({ where: { campaignId_key: { campaignId: activeCampaign.id, key: 'customFont' } } }),
    ]);

    // Apply custom overrides
    const overriddenTheme = { ...theme, sizes: { ...theme.sizes }, fonts: { ...theme.fonts } };
    if (headingScale?.value) overriddenTheme.sizes.headingScale = parseFloat(headingScale.value);
    if (bodySize?.value) overriddenTheme.sizes.bodySize = bodySize.value + 'px';
    if (cardRadius?.value) overriddenTheme.sizes.cardRadius = cardRadius.value + 'px';
    if (customFont?.value) {
      overriddenTheme.fonts.heading = `'${customFont.value}', ${theme.fonts.heading}`;
      overriddenTheme.fonts.body = `'${customFont.value}', ${theme.fonts.body}`;
    }

    const cssVars = themeToCSS(overriddenTheme);

    // Read per-section custom styles
    let sectionCSS = '';
    const sectionStylesSetting = await prisma.setting.findUnique({
      where: { campaignId_key: { campaignId: activeCampaign.id, key: 'sectionStyles' } },
    });
    if (sectionStylesSetting?.value) {
      try {
        const ss = JSON.parse(sectionStylesSetting.value) as Record<string, Record<string, string>>;
        for (const [section, styles] of Object.entries(ss)) {
          if (styles.titleSize) sectionCSS += `--${section}-title-size: ${styles.titleSize}px; `;
          if (styles.titleColor) sectionCSS += `--${section}-title-color: ${styles.titleColor}; `;
          if (styles.bodySize) sectionCSS += `--${section}-body-size: ${styles.bodySize}px; `;
          if (styles.bodyColor) sectionCSS += `--${section}-body-color: ${styles.bodyColor}; `;
          if (styles.font) sectionCSS += `--${section}-font: '${styles.font}', sans-serif; `;
        }
      } catch {}
    }

    const allVars = cssVars + (sectionCSS ? ' ' + sectionCSS : '');
    let googleFontUrl = `https://fonts.googleapis.com/css2?family=${theme.fonts.googleImport}&display=swap`;
    if (customFont?.value) {
      const encoded = encodeURIComponent(customFont.value).replace(/%20/g, '+');
      googleFontUrl += `&family=${encoded}:wght@300;400;500;700;900`;
    }
    // Load section custom fonts
    if (sectionStylesSetting?.value) {
      try {
        const ss = JSON.parse(sectionStylesSetting.value) as Record<string, Record<string, string>>;
        const fonts = new Set<string>();
        for (const styles of Object.values(ss)) {
          if (styles.font && styles.font !== customFont?.value) fonts.add(styles.font);
        }
        for (const f of fonts) {
          const encoded = encodeURIComponent(f).replace(/%20/g, '+');
          googleFontUrl += `&family=${encoded}:wght@300;400;500;700;900`;
        }
      } catch {}
    }

    return { cssVars: allVars, googleFontUrl };
  } catch {
    return { cssVars: '', googleFontUrl: '' };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { cssVars, googleFontUrl } = await getThemeCSS();

  return (
    <html lang="zh-TW">
      <head>
        {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
        {cssVars && <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} }` }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
