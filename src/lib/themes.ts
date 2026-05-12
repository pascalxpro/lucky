// Theme presets for the voting & lottery system
// From professional to festive, organized by mood and holidays

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  mode: 'light' | 'dark';
  category: 'professional' | 'lively' | 'holiday';
  description: string;
  fonts: {
    heading: string;
    body: string;
    googleImport: string;
  };
  sizes: {
    headingScale: number; // multiplier: 1.0 = default
    bodySize: string;
    cardRadius: string;
    spacing: string;
  };
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    bgDark: string;
    bgCard: string;
    gradientHero: string;
    gradientGold: string;
    gradientBtn: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    shadowGlow: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  // ─── Professional ───
  {
    id: 'corporate-blue',
    name: '商務深藍',
    emoji: '💼',
    mode: 'dark',
    category: 'professional',
    description: '沉穩專業的企業活動風格',
    fonts: {
      heading: "'Noto Sans TC', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.0, bodySize: '15px', cardRadius: '12px', spacing: '1.25rem' },
    colors: {
      primary: '#2563eb', primaryLight: '#60a5fa', primaryDark: '#1d4ed8',
      accent: '#0ea5e9', accentLight: '#38bdf8',
      bgDark: '#0c1222', bgCard: 'rgba(255,255,255,0.05)',
      gradientHero: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      gradientGold: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      gradientBtn: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
      text: '#e2e8f0', textSecondary: '#94a3b8', textMuted: '#64748b',
      shadowGlow: '0 0 30px rgba(37,99,235,0.3)',
    },
  },
  {
    id: 'elegant-slate',
    name: '典雅灰階',
    emoji: '🏢',
    mode: 'dark',
    category: 'professional',
    description: '低調奢華的高端品牌風',
    fonts: {
      heading: "'Noto Serif TC', serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.1, bodySize: '15px', cardRadius: '8px', spacing: '1.5rem' },
    colors: {
      primary: '#6366f1', primaryLight: '#a5b4fc', primaryDark: '#4338ca',
      accent: '#a78bfa', accentLight: '#c4b5fd',
      bgDark: '#111827', bgCard: 'rgba(255,255,255,0.04)',
      gradientHero: 'linear-gradient(135deg, #312e81 0%, #4c1d95 100%)',
      gradientGold: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
      gradientBtn: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      text: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b',
      shadowGlow: '0 0 30px rgba(99,102,241,0.3)',
    },
  },

  // ─── Default / Lively ───
  {
    id: 'purple-gold',
    name: '紫金派對',
    emoji: '🎉',
    mode: 'dark',
    category: 'lively',
    description: '預設主題 — 活力四射的紫金漸層',
    fonts: {
      heading: "'Noto Sans TC', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#7c3aed', primaryLight: '#a78bfa', primaryDark: '#5b21b6',
      accent: '#f59e0b', accentLight: '#fbbf24',
      bgDark: '#0f0b1a', bgCard: 'rgba(255,255,255,0.06)',
      gradientHero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gradientGold: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      gradientBtn: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      text: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b',
      shadowGlow: '0 0 30px rgba(124,58,237,0.3)',
    },
  },
  {
    id: 'neon-cyber',
    name: '電光霓虹',
    emoji: '⚡',
    mode: 'dark',
    category: 'lively',
    description: '未來科幻感的霓虹電光風',
    fonts: {
      heading: "'Outfit', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.05, bodySize: '15px', cardRadius: '12px', spacing: '1.25rem' },
    colors: {
      primary: '#06b6d4', primaryLight: '#67e8f9', primaryDark: '#0891b2',
      accent: '#f43f5e', accentLight: '#fb7185',
      bgDark: '#030712', bgCard: 'rgba(6,182,212,0.06)',
      gradientHero: 'linear-gradient(135deg, #0e7490 0%, #164e63 100%)',
      gradientGold: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
      gradientBtn: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
      text: '#e2e8f0', textSecondary: '#94a3b8', textMuted: '#64748b',
      shadowGlow: '0 0 30px rgba(6,182,212,0.4)',
    },
  },
  {
    id: 'tropical-sunset',
    name: '熱帶夕陽',
    emoji: '🌅',
    mode: 'dark',
    category: 'lively',
    description: '溫暖活潑的日落漸層',
    fonts: {
      heading: "'Noto Sans TC', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '20px', spacing: '1.25rem' },
    colors: {
      primary: '#e11d48', primaryLight: '#fb7185', primaryDark: '#be123c',
      accent: '#f97316', accentLight: '#fb923c',
      bgDark: '#1a0a0a', bgCard: 'rgba(225,29,72,0.06)',
      gradientHero: 'linear-gradient(135deg, #be123c 0%, #c2410c 100%)',
      gradientGold: 'linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)',
      gradientBtn: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
      text: '#fef2f2', textSecondary: '#fca5a5', textMuted: '#f87171',
      shadowGlow: '0 0 30px rgba(225,29,72,0.3)',
    },
  },

  // ─── Holidays ───
  {
    id: 'chinese-new-year',
    name: '農曆新年',
    emoji: '🧧',
    mode: 'dark',
    category: 'holiday',
    description: '喜氣紅金的春節風格',
    fonts: {
      heading: "'Noto Serif TC', serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.1, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#dc2626', primaryLight: '#f87171', primaryDark: '#b91c1c',
      accent: '#eab308', accentLight: '#facc15',
      bgDark: '#1c0808', bgCard: 'rgba(220,38,38,0.08)',
      gradientHero: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
      gradientGold: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
      gradientBtn: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
      text: '#fef2f2', textSecondary: '#fca5a5', textMuted: '#ef4444',
      shadowGlow: '0 0 30px rgba(220,38,38,0.4)',
    },
  },
  {
    id: 'christmas',
    name: '聖誕節',
    emoji: '🎄',
    mode: 'dark',
    category: 'holiday',
    description: '經典紅綠配的聖誕佳節',
    fonts: {
      heading: "'Noto Sans TC', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#16a34a', primaryLight: '#4ade80', primaryDark: '#15803d',
      accent: '#dc2626', accentLight: '#f87171',
      bgDark: '#052e16', bgCard: 'rgba(22,163,74,0.08)',
      gradientHero: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
      gradientGold: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
      gradientBtn: 'linear-gradient(135deg, #16a34a 0%, #dc2626 100%)',
      text: '#f0fdf4', textSecondary: '#86efac', textMuted: '#4ade80',
      shadowGlow: '0 0 30px rgba(22,163,74,0.4)',
    },
  },
  {
    id: 'valentines',
    name: '情人節',
    emoji: '💕',
    mode: 'dark',
    category: 'holiday',
    description: '浪漫粉紅的愛情氛圍',
    fonts: {
      heading: "'Noto Sans TC', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '20px', spacing: '1.25rem' },
    colors: {
      primary: '#ec4899', primaryLight: '#f9a8d4', primaryDark: '#db2777',
      accent: '#f43f5e', accentLight: '#fb7185',
      bgDark: '#1a0a14', bgCard: 'rgba(236,72,153,0.06)',
      gradientHero: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
      gradientGold: 'linear-gradient(135deg, #fda4af 0%, #f9a8d4 100%)',
      gradientBtn: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      text: '#fdf2f8', textSecondary: '#f9a8d4', textMuted: '#f472b6',
      shadowGlow: '0 0 30px rgba(236,72,153,0.4)',
    },
  },
  {
    id: 'halloween',
    name: '萬聖節',
    emoji: '🎃',
    mode: 'dark',
    category: 'holiday',
    description: '神秘暗黑的萬聖節風格',
    fonts: {
      heading: "'Outfit', sans-serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.05, bodySize: '15px', cardRadius: '14px', spacing: '1.25rem' },
    colors: {
      primary: '#f97316', primaryLight: '#fb923c', primaryDark: '#ea580c',
      accent: '#a855f7', accentLight: '#c084fc',
      bgDark: '#0a0a0a', bgCard: 'rgba(249,115,22,0.06)',
      gradientHero: 'linear-gradient(135deg, #431407 0%, #1c1917 100%)',
      gradientGold: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
      gradientBtn: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
      text: '#fafaf9', textSecondary: '#d6d3d1', textMuted: '#a8a29e',
      shadowGlow: '0 0 30px rgba(249,115,22,0.4)',
    },
  },
  {
    id: 'mid-autumn',
    name: '中秋節',
    emoji: '🥮',
    mode: 'dark',
    category: 'holiday',
    description: '溫潤月光金的中秋佳節',
    fonts: {
      heading: "'Noto Serif TC', serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.1, bodySize: '16px', cardRadius: '16px', spacing: '1.5rem' },
    colors: {
      primary: '#d97706', primaryLight: '#fbbf24', primaryDark: '#b45309',
      accent: '#b45309', accentLight: '#f59e0b',
      bgDark: '#1a1000', bgCard: 'rgba(217,119,6,0.06)',
      gradientHero: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
      gradientGold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      gradientBtn: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      text: '#fefce8', textSecondary: '#fde68a', textMuted: '#fbbf24',
      shadowGlow: '0 0 30px rgba(217,119,6,0.4)',
    },
  },
  {
    id: 'dragon-boat',
    name: '端午節',
    emoji: '🐉',
    mode: 'dark',
    category: 'holiday',
    description: '傳統青綠的端午龍舟風',
    fonts: {
      heading: "'Noto Serif TC', serif",
      body: "'Noto Sans TC', sans-serif",
      googleImport: 'Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700;800',
    },
    sizes: { headingScale: 1.05, bodySize: '16px', cardRadius: '14px', spacing: '1.25rem' },
    colors: {
      primary: '#059669', primaryLight: '#34d399', primaryDark: '#047857',
      accent: '#0d9488', accentLight: '#2dd4bf',
      bgDark: '#022c22', bgCard: 'rgba(5,150,105,0.06)',
      gradientHero: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      gradientGold: 'linear-gradient(135deg, #34d399 0%, #2dd4bf 100%)',
      gradientBtn: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
      text: '#ecfdf5', textSecondary: '#a7f3d0', textMuted: '#6ee7b7',
      shadowGlow: '0 0 30px rgba(5,150,105,0.4)',
    },
  },
  // ─── Light Themes ───
  {
    id: 'warm-beige', name: '暖杏活動', emoji: '🍑', mode: 'light', category: 'lively',
    description: '溫暖奶油色系，適合票選與市集活動',
    fonts: { heading: "'Noto Sans TC', sans-serif", body: "'Noto Sans TC', sans-serif", googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800' },
    sizes: { headingScale: 1.05, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#e07c3a', primaryLight: '#f4a261', primaryDark: '#c45e1a',
      accent: '#2d8b4f', accentLight: '#5bba6f',
      bgDark: '#fdf6ee', bgCard: 'rgba(0,0,0,0.03)',
      gradientHero: 'linear-gradient(135deg, #e07c3a 0%, #f4a261 100%)',
      gradientGold: 'linear-gradient(135deg, #e07c3a 0%, #f4a261 100%)',
      gradientBtn: 'linear-gradient(135deg, #e07c3a 0%, #f4a261 100%)',
      text: '#3d2b1f', textSecondary: '#6b5344', textMuted: '#9c8577',
      shadowGlow: '0 4px 20px rgba(224,124,58,0.15)',
    },
  },
  {
    id: 'fresh-green', name: '清新草綠', emoji: '🌿', mode: 'light', category: 'lively',
    description: '自然清新的綠色調，適合環保與社區活動',
    fonts: { heading: "'Noto Sans TC', sans-serif", body: "'Noto Sans TC', sans-serif", googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800' },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#16a34a', primaryLight: '#4ade80', primaryDark: '#15803d',
      accent: '#d97706', accentLight: '#f59e0b',
      bgDark: '#f0faf4', bgCard: 'rgba(0,0,0,0.03)',
      gradientHero: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
      gradientGold: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      gradientBtn: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)',
      text: '#2d1b0e', textSecondary: '#5c4033', textMuted: '#8b7355',
      shadowGlow: '0 4px 20px rgba(22,163,74,0.12)',
    },
  },
  {
    id: 'sakura-pink', name: '櫻花粉彩', emoji: '🌸', mode: 'light', category: 'lively',
    description: '柔美粉色系，適合女性主題與浪漫活動',
    fonts: { heading: "'Noto Sans TC', sans-serif", body: "'Noto Sans TC', sans-serif", googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800' },
    sizes: { headingScale: 1.0, bodySize: '16px', cardRadius: '20px', spacing: '1.25rem' },
    colors: {
      primary: '#e84393', primaryLight: '#fd79a8', primaryDark: '#c0245d',
      accent: '#a855f7', accentLight: '#c084fc',
      bgDark: '#fdf2f8', bgCard: 'rgba(0,0,0,0.03)',
      gradientHero: 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)',
      gradientGold: 'linear-gradient(135deg, #e84393 0%, #a855f7 100%)',
      gradientBtn: 'linear-gradient(135deg, #e84393 0%, #fd79a8 100%)',
      text: '#3d1f2e', textSecondary: '#6b4457', textMuted: '#a87b90',
      shadowGlow: '0 4px 20px rgba(232,67,147,0.12)',
    },
  },
  {
    id: 'ocean-sky', name: '海洋天空', emoji: '🌊', mode: 'light', category: 'professional',
    description: '清爽藍色調，適合科技與教育活動',
    fonts: { heading: "'Noto Sans TC', sans-serif", body: "'Noto Sans TC', sans-serif", googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800' },
    sizes: { headingScale: 1.0, bodySize: '15px', cardRadius: '12px', spacing: '1.25rem' },
    colors: {
      primary: '#2563eb', primaryLight: '#60a5fa', primaryDark: '#1d4ed8',
      accent: '#0ea5e9', accentLight: '#38bdf8',
      bgDark: '#f0f7ff', bgCard: 'rgba(0,0,0,0.03)',
      gradientHero: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
      gradientGold: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
      gradientBtn: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
      text: '#1e293b', textSecondary: '#475569', textMuted: '#94a3b8',
      shadowGlow: '0 4px 20px rgba(37,99,235,0.12)',
    },
  },
  {
    id: 'sunny-orange', name: '陽光橘彩', emoji: '🌻', mode: 'light', category: 'holiday',
    description: '明亮橘黃色系，適合美食節與嘉年華',
    fonts: { heading: "'Noto Sans TC', sans-serif", body: "'Noto Sans TC', sans-serif", googleImport: 'Noto+Sans+TC:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800' },
    sizes: { headingScale: 1.05, bodySize: '16px', cardRadius: '16px', spacing: '1.25rem' },
    colors: {
      primary: '#ea580c', primaryLight: '#fb923c', primaryDark: '#c2410c',
      accent: '#d97706', accentLight: '#fbbf24',
      bgDark: '#fffbf0', bgCard: 'rgba(0,0,0,0.03)',
      gradientHero: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
      gradientGold: 'linear-gradient(135deg, #ea580c 0%, #fbbf24 100%)',
      gradientBtn: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
      text: '#3d2200', textSecondary: '#6b4c1f', textMuted: '#a8845a',
      shadowGlow: '0 4px 20px rgba(234,88,12,0.12)',
    },
  },
];

// Image dimension constants for consistency hints
export const IMAGE_DIMENSIONS = {
  banner: { width: 1200, height: 514, label: '1200 × 514 px (21:9)', ratio: '21:9' },
  project: { width: 800, height: 600, label: '800 × 600 px (4:3)', ratio: '4:3' },
  prize: { width: 400, height: 400, label: '400 × 400 px (1:1)', ratio: '1:1' },
} as const;

// Generate CSS variables string from a theme preset
export function themeToCSS(theme: ThemePreset): string {
  const c = theme.colors;
  const s = theme.sizes;
  const isLight = theme.mode === 'light';
  return `
    --font-zh: ${theme.fonts.body};
    --font-heading: ${theme.fonts.heading};
    --primary: ${c.primary}; --primary-light: ${c.primaryLight}; --primary-dark: ${c.primaryDark};
    --accent: ${c.accent}; --accent-light: ${c.accentLight};
    --bg-dark: ${c.bgDark}; --bg-card: ${c.bgCard};
    --bg-card-hover: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'};
    --glass: ${isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)'};
    --glass-border: ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'};
    --gradient-hero: ${c.gradientHero};
    --gradient-gold: ${c.gradientGold};
    --gradient-card: ${isLight ? `linear-gradient(145deg, ${c.primary}10, ${c.accent}08)` : `linear-gradient(145deg, ${c.primary}26, ${c.accent}14)`};
    --gradient-btn: ${c.gradientBtn};
    --text: ${c.text}; --text-secondary: ${c.textSecondary}; --text-muted: ${c.textMuted};
    --shadow-glow: ${c.shadowGlow};
    --shadow-card: ${isLight ? '0 4px 16px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.3)'};
    --input-bg: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'};
    --hero-bg: ${isLight ? c.bgDark : `linear-gradient(180deg, ${c.bgDark} 0%, ${c.primaryDark}15 50%, ${c.bgDark} 100%)`};
    --hero-glow: ${isLight ? `radial-gradient(ellipse at 50% 0%, ${c.primary}12 0%, transparent 70%)` : `radial-gradient(ellipse at 50% 0%, ${c.primary}33 0%, transparent 70%)`};
    --modal-bg: ${isLight ? 'linear-gradient(145deg, #ffffff, #f8f9fa)' : `linear-gradient(145deg, ${c.primaryDark}40, ${c.primary}30)`};
    --radius: ${s.cardRadius};
    --heading-scale: ${s.headingScale};
    --body-size: ${s.bodySize};
    --spacing: ${s.spacing};
  `.trim();
}
