'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCampaigns, updateCampaign, getSetting, setSetting, getPrizes } from '@/lib/actions';
import { THEME_PRESETS, IMAGE_DIMENSIONS, themeToCSS, type ThemePreset } from '@/lib/themes';
import { Save, Palette, Music, FileText, Gamepad2, Image, Type, Check, Ruler, Vote, ChevronDown, ChevronUp, Play, X, Globe, Building2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import dynamic from 'next/dynamic';

const WheelGame = dynamic(() => import('@/components/games/WheelGame'), { ssr: false });
const ScratchGame = dynamic(() => import('@/components/games/ScratchGame'), { ssr: false });
const SlotGame = dynamic(() => import('@/components/games/SlotGame'), { ssr: false });

const FALLBACK_PRIZES = [
  { id: 'p1', name: '🎁 體驗大獎' }, { id: 'p2', name: '🎫 體驗禮券' },
  { id: 'p3', name: '⭐ 體驗小獎' }, { id: 'p4', name: '🎯 再接再厲' },
  { id: 'p5', name: '💎 鑽石獎' }, { id: 'p6', name: '🌟 幸運獎' },
];

type SectionStyle = { titleSize: string; titleColor: string; bodySize: string; bodyColor: string; font: string };
type SectionStyles = Record<string, SectionStyle>;

const SECTIONS = [
  { key: 'hero', label: '🎯 活動標題 (Hero)', desc: '首頁主標題與副標題' },
  { key: 'details', label: 'ℹ️ 活動說明', desc: '活動說明區塊標題與文字' },
  { key: 'prize', label: '🏆 獎品區', desc: '獎品標題與獎品名稱' },
  { key: 'project', label: '🎨 投票作品卡片', desc: '作品名稱、描述、票數' },
  { key: 'modal', label: '🔍 作品彈窗', desc: '彈窗內標題與描述' },
  { key: 'footer', label: '📄 頁尾', desc: '版權文字' },
];

const FONT_OPTIONS = [
  { value: '', label: '主題預設' },
  { value: 'Noto Sans TC', label: '思源黑體' },
  { value: 'Noto Serif TC', label: '思源宋體' },
  { value: 'LXGW WenKai TC', label: '霞鶩文楷' },
  { value: 'Outfit', label: 'Outfit (英文)' },
];

const defaultSectionStyle = (): SectionStyle => ({ titleSize: '', titleColor: '', bodySize: '', bodyColor: '', font: '' });

export default function SettingsPage() {
  const [campaignId, setCampaignId] = useState('');
  const [gameMode, setGameMode] = useState('wheel');
  const [activeThemeId, setActiveThemeId] = useState('purple-gold');
  const [customFont, setCustomFont] = useState('');
  const [customHeadingScale, setCustomHeadingScale] = useState(1.0);
  const [customBodySize, setCustomBodySize] = useState('16');
  const [customRadius, setCustomRadius] = useState('16');
  const [maxVotesPerPerson, setMaxVotesPerPerson] = useState(0);
  const [maxVotesPerIP, setMaxVotesPerIP] = useState(0);
  const [votesPerGame, setVotesPerGame] = useState(1);
  const [sectionStyles, setSectionStyles] = useState<SectionStyles>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [previewGame, setPreviewGame] = useState<string | null>(null);
  const [requireClaimInfo, setRequireClaimInfo] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'theme' | 'game' | 'branding' | 'system'>('theme');
  const [realPrizes, setRealPrizes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const campaigns = await getCampaigns();
      const active = campaigns.find(c => c.isActive);
      if (active) {
        setCampaignId(active.id);
        setGameMode(active.gameMode);
        const themeId = await getSetting(active.id, 'themeId');
        if (themeId) setActiveThemeId(themeId);
        const font = await getSetting(active.id, 'customFont');
        if (font) setCustomFont(font);
        const hs = await getSetting(active.id, 'headingScale');
        if (hs) setCustomHeadingScale(parseFloat(hs));
        const bs = await getSetting(active.id, 'bodySize');
        if (bs) setCustomBodySize(bs);
        const cr = await getSetting(active.id, 'cardRadius');
        if (cr) setCustomRadius(cr);
        const mvp = await getSetting(active.id, 'maxVotesPerPerson');
        if (mvp) setMaxVotesPerPerson(parseInt(mvp, 10));
        const mvip = await getSetting(active.id, 'maxVotesPerIP');
        if (mvip) setMaxVotesPerIP(parseInt(mvip, 10));
        const vpg = await getSetting(active.id, 'votesPerGame');
        if (vpg) setVotesPerGame(parseInt(vpg, 10));
        const ss = await getSetting(active.id, 'sectionStyles');
        if (ss) try { setSectionStyles(JSON.parse(ss)); } catch {}
        const rci = await getSetting(active.id, 'requireClaimInfo');
        if (rci !== null && rci !== undefined) setRequireClaimInfo(rci !== 'false');
        const sn = await getSetting(active.id, 'siteName');
        if (sn) setSiteName(sn);
        const fav = await getSetting(active.id, 'faviconUrl');
        if (fav) setFaviconUrl(fav);
        const logo = await getSetting(active.id, 'logoUrl');
        if (logo) setLogoUrl(logo);
        const cn = await getSetting(active.id, 'companyName');
        if (cn) setCompanyName(cn);
        const tym = await getSetting(active.id, 'thankYouMessage');
        if (tym) setThankYouMessage(tym);
        // Load actual prizes for game preview
        const prizes = await getPrizes(active.id);
        if (prizes.length > 0) {
          setRealPrizes(prizes.map(p => ({ id: p.id, name: p.name })));
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!campaignId) return;
    await updateCampaign(campaignId, { gameMode });
    await setSetting(campaignId, 'themeId', activeThemeId);
    if (customFont) await setSetting(campaignId, 'customFont', customFont);
    await setSetting(campaignId, 'headingScale', String(customHeadingScale));
    await setSetting(campaignId, 'bodySize', customBodySize);
    await setSetting(campaignId, 'cardRadius', customRadius);
    await setSetting(campaignId, 'maxVotesPerPerson', String(maxVotesPerPerson));
    await setSetting(campaignId, 'maxVotesPerIP', String(maxVotesPerIP));
    await setSetting(campaignId, 'votesPerGame', String(votesPerGame));
    if (Object.keys(sectionStyles).length > 0) {
      await setSetting(campaignId, 'sectionStyles', JSON.stringify(sectionStyles));
    }
    await setSetting(campaignId, 'requireClaimInfo', String(requireClaimInfo));
    await setSetting(campaignId, 'siteName', siteName);
    await setSetting(campaignId, 'faviconUrl', faviconUrl);
    await setSetting(campaignId, 'logoUrl', logoUrl);
    await setSetting(campaignId, 'companyName', companyName);
    await setSetting(campaignId, 'thankYouMessage', thankYouMessage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSection = (key: string, field: keyof SectionStyle, value: string) => {
    setSectionStyles(prev => ({
      ...prev,
      [key]: { ...(prev[key] || defaultSectionStyle()), [field]: value },
    }));
  };

  const getSection = (key: string): SectionStyle => sectionStyles[key] || defaultSectionStyle();

  const activeTheme = THEME_PRESETS.find(t => t.id === activeThemeId) || THEME_PRESETS[2]; // default purple-gold

  if (loading) return <p style={{ padding: '2rem' }}>載入中...</p>;

  const sections = [
    { id: 'light', label: '☀️ 亮色系主題', desc: '明亮溫暖的活動風格', filter: (t: typeof THEME_PRESETS[0]) => t.mode === 'light' },
    { id: 'dark-pro', label: '💼 專業暗色', desc: '企業活動與正式場合', filter: (t: typeof THEME_PRESETS[0]) => t.mode === 'dark' && t.category === 'professional' },
    { id: 'dark-lively', label: '🎉 活潑暗色', desc: '一般活動與社群互動', filter: (t: typeof THEME_PRESETS[0]) => t.mode === 'dark' && t.category === 'lively' },
    { id: 'dark-holiday', label: '🎊 節日暗色', desc: '依重大節日設計的專屬佈景', filter: (t: typeof THEME_PRESETS[0]) => t.mode === 'dark' && t.category === 'holiday' },
  ];

  return (
    <div>
      <div className="admin-header">
        <h1>⚙️ 系統設定</h1>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <Save size={16} /> {saved ? '✓ 已儲存' : '儲存所有設定'}
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
        {[
          { key: 'theme' as const, icon: <Palette size={16} />, label: '佈景主題' },
          { key: 'branding' as const, icon: <Globe size={16} />, label: '網站品牌' },
          { key: 'game' as const, icon: <Gamepad2 size={16} />, label: '遊戲模式' },
          { key: 'system' as const, icon: <FileText size={16} />, label: '系統資訊' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Theme Tab ─── */}
      {activeTab === 'theme' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Theme presets by section */}
          {sections.map(sec => (
            <div key={sec.id} className="admin-panel">
              <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {sec.label}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>{sec.desc}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {THEME_PRESETS.filter(sec.filter).map(theme => {
                  const isActive = theme.id === activeThemeId;
                  return (
                    <button key={theme.id} onClick={() => setActiveThemeId(theme.id)}
                      style={{
                        textAlign: 'left', padding: '1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        border: isActive ? `2px solid ${theme.colors.primary}` : '1px solid var(--admin-border)',
                        background: isActive ? `${theme.colors.primary}15` : 'var(--admin-card)',
                        transition: 'var(--transition)', position: 'relative',
                      }}>
                      {isActive && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: theme.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} color="white" />
                        </div>
                      )}
                      {/* Color preview */}
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.colors.primary }} />
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.colors.accent }} />
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.colors.bgDark, border: '1px solid var(--admin-border)' }} />
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.colors.gradientBtn.includes('linear') ? theme.colors.primary : theme.colors.primaryLight }} />
                      </div>
                      <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>
                        {theme.emoji} <strong style={{ fontSize: '0.9rem' }}>{theme.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{theme.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Live preview */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👁️ 即時預覽 — {activeTheme.emoji} {activeTheme.name}
              <span className={`badge ${activeTheme.mode === 'light' ? 'badge-gold' : 'badge-primary'}`} style={{ marginLeft: 8 }}>
                {activeTheme.mode === 'light' ? '☀️ 亮色' : '🌙 暗色'}
              </span>
            </div>
            <div style={{
              padding: '2rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative',
              background: activeTheme.colors.bgDark, color: activeTheme.colors.text,
            }}>
              {/* Glow orb */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: activeTheme.colors.primary, opacity: 0.15, filter: 'blur(40px)' }} />
              <h3 style={{
                fontFamily: activeTheme.fonts.heading,
                fontSize: `${1.3 * activeTheme.sizes.headingScale}rem`, fontWeight: 800, marginBottom: '0.75rem',
                background: activeTheme.colors.gradientHero, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {activeTheme.emoji} 活動標題預覽
              </h3>
              <p style={{ fontFamily: activeTheme.fonts.body, fontSize: activeTheme.sizes.bodySize, color: activeTheme.colors.textSecondary, marginBottom: '1rem' }}>
                這是正文字體的展示效果，可以看到字型大小與配色的搭配。
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.5rem 1.25rem', borderRadius: activeTheme.sizes.cardRadius, background: activeTheme.colors.gradientBtn, color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                  投票按鈕
                </span>
                <span style={{ padding: '0.5rem 1.25rem', borderRadius: activeTheme.sizes.cardRadius, background: activeTheme.colors.gradientGold, color: '#1a1a2e', fontWeight: 600, fontSize: '0.85rem' }}>
                  抽獎按鈕
                </span>
                <span style={{ padding: '0.5rem 1.25rem', borderRadius: activeTheme.sizes.cardRadius, border: `1px solid ${activeTheme.colors.primary}`, color: activeTheme.colors.primaryLight, fontSize: '0.85rem' }}>
                  輪廓按鈕
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: activeTheme.sizes.cardRadius, background: activeTheme.colors.bgCard, border: `1px solid ${activeTheme.colors.primary}30`, flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: activeTheme.colors.textMuted }}>票數</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", background: activeTheme.colors.gradientGold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>1,234</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: activeTheme.sizes.cardRadius, background: activeTheme.colors.bgCard, border: `1px solid ${activeTheme.colors.primary}30`, flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: activeTheme.colors.textMuted }}>獎品</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: activeTheme.colors.accent }}>🏆 5</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fine-tuning */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={18} /> 字體與尺寸微調
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">
                  <Ruler size={14} style={{ display: 'inline', marginRight: 4 }} />
                  標題字體大小倍率
                </label>
                <input type="range" min="0.8" max="1.4" step="0.05" value={customHeadingScale}
                  onChange={e => setCustomHeadingScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: activeTheme.colors.primary }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {customHeadingScale.toFixed(2)}x
                </div>
              </div>
              <div>
                <label className="form-label">內文字體大小 (px)</label>
                <input type="number" value={customBodySize} min="12" max="20" step="1"
                  onChange={e => setCustomBodySize(e.target.value)} />
              </div>
              <div>
                <label className="form-label">卡片圓角 (px)</label>
                <input type="number" value={customRadius} min="0" max="30" step="2"
                  onChange={e => setCustomRadius(e.target.value)} />
              </div>
              <div>
                <label className="form-label">自訂字體 (選填)</label>
                <input placeholder="如: LXGW WenKai TC" value={customFont}
                  onChange={e => setCustomFont(e.target.value)} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  需為 Google Fonts 已有的字體名稱
                </div>
              </div>
            </div>
          </div>

          {/* ── Section Styles Editor ── */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📝 區塊文字樣式
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>可針對每個區塊個別設定字體、大小、顏色</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SECTIONS.map(sec => {
                const isOpen = expandedSection === sec.key;
                const s = getSection(sec.key);
                const hasCustom = s.titleSize || s.titleColor || s.bodySize || s.bodyColor || s.font;
                return (
                  <div key={sec.key} style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedSection(isOpen ? null : sec.key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: isOpen ? 'rgba(124,58,237,0.1)' : 'transparent', textAlign: 'left' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{sec.label}</span>
                      {hasCustom && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>已自訂</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sec.desc}</span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--admin-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label className="form-label">標題字體大小 (px)</label>
                          <input type="number" placeholder="主題預設" min={12} max={48} value={s.titleSize} onChange={e => updateSection(sec.key, 'titleSize', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">標題顏色</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="color" value={s.titleColor || '#ffffff'} onChange={e => updateSection(sec.key, 'titleColor', e.target.value)} style={{ width: 40, height: 36, padding: 2, cursor: 'pointer' }} />
                            <input placeholder="#FFFFFF 或留空" value={s.titleColor} onChange={e => updateSection(sec.key, 'titleColor', e.target.value)} style={{ flex: 1 }} />
                          </div>
                        </div>
                        <div>
                          <label className="form-label">內文字體大小 (px)</label>
                          <input type="number" placeholder="主題預設" min={10} max={24} value={s.bodySize} onChange={e => updateSection(sec.key, 'bodySize', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">內文顏色</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="color" value={s.bodyColor || '#cccccc'} onChange={e => updateSection(sec.key, 'bodyColor', e.target.value)} style={{ width: 40, height: 36, padding: 2, cursor: 'pointer' }} />
                            <input placeholder="#CCCCCC 或留空" value={s.bodyColor} onChange={e => updateSection(sec.key, 'bodyColor', e.target.value)} style={{ flex: 1 }} />
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">字體</label>
                          <select value={s.font} onChange={e => updateSection(sec.key, 'font', e.target.value)}>
                            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                        </div>
                        {/* Live preview */}
                        <div style={{ gridColumn: '1 / -1', padding: '1rem', background: activeTheme.colors.bgDark, borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>即時預覽</div>
                          <div style={{ fontSize: s.titleSize ? `${s.titleSize}px` : '1.3rem', color: s.titleColor || activeTheme.colors.text, fontWeight: 800, fontFamily: s.font ? `'${s.font}', sans-serif` : activeTheme.fonts.heading, marginBottom: '0.4rem' }}>
                            {sec.label.slice(2).trim()} 標題預覽
                          </div>
                          <div style={{ fontSize: s.bodySize ? `${s.bodySize}px` : '0.9rem', color: s.bodyColor || activeTheme.colors.textSecondary, fontFamily: s.font ? `'${s.font}', sans-serif` : activeTheme.fonts.body, lineHeight: 1.6 }}>
                            這是內文字體的展示效果，可以看到字型大小與配色。
                          </div>
                        </div>
                        <button className="btn btn-outline btn-sm" style={{ justifySelf: 'start' }}
                          onClick={() => setSectionStyles(prev => { const n = { ...prev }; delete n[sec.key]; return n; })}>
                          🔄 重置為主題預設
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image dimensions reference */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={18} /> 圖片尺寸規格
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(IMAGE_DIMENSIONS).map(([key, dim]) => (
                <div key={key} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                  <div style={{ aspectRatio: dim.ratio, background: 'var(--gradient-card)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dim.ratio}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                    {key === 'banner' ? '🖼️ Banner 圖片' : key === 'project' ? '🎨 作品圖片' : '🏆 獎品圖片'}
                  </div>
                  <div className="font-en" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{dim.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Branding Tab ─── */}
      {activeTab === 'branding' && (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 700 }}>
          {/* Site Name & Favicon */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} /> 網站圖示與名稱
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>瀏覽器分頁上顯示的圖示與標題</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">網站名稱（瀏覽器分頁標題）</label>
                <input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="例如：2026 年度人氣票選" />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  留空則使用預設名稱「互動投票抽獎 | Riiqi Lucky」
                </div>
              </div>
              <div>
                <label className="form-label">網站圖示 (Favicon)</label>
                <ImageUploader value={faviconUrl} onChange={setFaviconUrl} hint="建議 64×64 px 正方形 PNG 或 ICO" maxWidth={128} maxHeight={128} />
              </div>
              {/* Live preview */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>瀏覽器分頁預覽</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--admin-sidebar)', borderRadius: '8px 8px 0 0', maxWidth: 300 }}>
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="favicon" style={{ width: 16, height: 16, borderRadius: 2, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 2, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 800 }}>R</div>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {siteName || '互動投票抽獎 | Riiqi Lucky'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Company Name */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} /> 首頁 Logo 與公司名稱
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>顯示在首頁標題上方</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">公司 / 品牌名稱</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="例如：Riiqi Studio" />
              </div>
              <div>
                <label className="form-label">Logo 圖片</label>
                <ImageUploader value={logoUrl} onChange={setLogoUrl} hint="建議 200×200 px 正方形透明 PNG" maxWidth={400} maxHeight={400} />
              </div>
              {/* Live preview */}
              <div style={{ padding: '1.5rem', background: activeTheme.colors.bgDark, borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>首頁顯示預覽</div>
                {(logoUrl || companyName) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: '12px' }} />
                    )}
                    {companyName && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: activeTheme.colors.textSecondary, letterSpacing: '0.05em' }}>
                        {companyName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>尚未設定 Logo 或公司名稱</div>
                )}
                <div style={{ fontSize: '1.2rem', fontWeight: 800, background: activeTheme.colors.gradientHero, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  🎉 活動標題預覽
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Game Tab ─── */}
      {activeTab === 'game' && (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 600 }}>
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gamepad2 size={18} /> 遊戲模式
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { value: 'wheel', label: '🎡 幸運轉盤', desc: 'Canvas 繪製轉盤，旋轉減速效果' },
                { value: 'scratch', label: '🎫 刮刮樂', desc: '觸控/滑鼠刮除銀色塗層' },
                { value: 'slot', label: '🎰 拉霸機', desc: '三欄符號滾動，依序停止' },
              ].map(mode => (
                <div key={mode.value} style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button onClick={() => setGameMode(mode.value)} className="admin-panel"
                    style={{
                      cursor: 'pointer', textAlign: 'center', padding: '1.25rem', flex: 1,
                      border: gameMode === mode.value ? '2px solid var(--primary)' : '1px solid var(--admin-border)',
                      background: gameMode === mode.value ? 'rgba(124,58,237,0.1)' : 'var(--admin-card)',
                    }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{mode.label.slice(0, 2)}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{mode.label.slice(2).trim()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mode.desc}</div>
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setPreviewGame(mode.value)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Play size={14} /> 試玩預覽
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Vote size={18} /> 投票規則
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">每人可投票數上限</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="number" value={maxVotesPerPerson} min={0} max={100}
                    onChange={e => setMaxVotesPerPerson(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 100 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {maxVotesPerPerson === 0 ? '不限制（可投所有作品）' : `每人最多投 ${maxVotesPerPerson} 票`}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  💡 設為 <strong>0</strong> 表示不限制票數（每個作品仍只能投一次）<br />
                  💡 設為 <strong>3</strong> 表示每人總共最多只能投 3 個作品
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                📋 <strong>現行規則：</strong> 每人對同一作品只能投一次。
                {maxVotesPerPerson > 0
                  ? ` 且總共最多可投 ${maxVotesPerPerson} 個不同的作品。`
                  : ' 總票數不限制。'}
              </div>
              {/* IP-based rate limit */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                <label className="form-label">🛡️ 同一 IP 投票上限（防灌票）</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="number" value={maxVotesPerIP} min={0} max={9999}
                    onChange={e => setMaxVotesPerIP(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 100 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {maxVotesPerIP === 0 ? '不限制（依設備辨識）' : `同一 IP 最多 ${maxVotesPerIP} 票`}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  💡 設為 <strong>0</strong> 表示不限制 IP 投票數（僅靠設備指紋防重投）<br />
                  💡 建議值 <strong>10~50</strong>：可防止同一人用無痕模式重複灌票<br />
                  ⚠️ 注意：同一公司 / 家庭 / 學校共用 IP，設太低可能影響正常用戶
                </div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                🛡️ <strong>防灌票三層防護：</strong><br />
                ① 設備指紋辨識（同瀏覽器+同設備 = 同人，含無痕模式）<br />
                ② 每人總票數上限（{maxVotesPerPerson === 0 ? '目前未限制' : `最多 ${maxVotesPerPerson} 票`}）<br />
                ③ 同 IP 投票上限（{maxVotesPerIP === 0 ? '目前未限制' : `最多 ${maxVotesPerIP} 票`}）
              </div>
            </div>
          </div>
          {/* Votes per game */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎲 抽獎觸發條件
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">每投幾票可玩一次遊戲</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="number" value={votesPerGame} min={1} max={20}
                    onChange={e => setVotesPerGame(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 100 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {votesPerGame === 1 ? '每投一票即可抽獎' : `每投滿 ${votesPerGame} 票可玩一次遊戲`}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  💡 設為 <strong>1</strong> 表示每投一票就能玩一次抽獎遊戲（原始行為）<br />
                  💡 設為 <strong>3</strong> 表示用戶需投滿 3 票才能觸發一次抽獎遊戲
                </div>
              </div>
              {/* Progress preview */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>用戶端進度條預覽</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((2 / votesPerGame) * 100)}%`, height: '100%', borderRadius: 4, background: 'var(--gradient-gold)', transition: 'width 0.3s ease' }} />
                  </div>
                  <span className="font-en" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', minWidth: 50 }}>
                    2/{votesPerGame}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  {votesPerGame === 1 ? '✅ 每投一票立即觸發遊戲' : `⚠️ 還需投 ${votesPerGame - 2} 票才能玩遊戲`}
                </div>
              </div>
            </div>
          </div>
          {/* Claim info setting */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎁 中獎領獎設定
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)', background: requireClaimInfo ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={requireClaimInfo} onChange={e => setRequireClaimInfo(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>中獎後需填寫個資</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    啟用後，中獎者需填寫姓名、手機、地址等資料以利後續寄送獎品
                  </div>
                </div>
              </label>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {requireClaimInfo
                  ? '✅ 目前設定：中獎後會跳出領獎表單，要求填寫姓名、手機號碼、收件地址。'
                  : '⚠️ 目前設定：中獎後僅顯示恭喜訊息，不要求填寫個資。'}
              </div>
            </div>
          </div>
          {/* Thank you message */}
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🙏 遊戲結束感謝詞
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">自訂感謝訊息</label>
                <textarea
                  value={thankYouMessage}
                  onChange={e => setThankYouMessage(e.target.value)}
                  placeholder="感謝您的投票與參加抽獎活動，您的每一票都是最珍貴的支持！"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  留空則使用預設訊息。此訊息在用戶玩完遊戲後的感謝彈窗中顯示。
                </div>
              </div>
              {/* Preview */}
              <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>彈窗預覽</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🙏</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', background: activeTheme.colors.gradientHero, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>感謝您的參與！</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {thankYouMessage || '感謝您的投票與參加抽獎活動，\n您的每一票都是最珍貴的支持！'}
                </div>
              </div>
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Music size={18} /> 音效設定
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              系統內建合成音效（點擊、轉動、中獎、落選），無需上傳音檔。
            </p>
          </div>
        </div>
      )}

      {/* ─── System Tab ─── */}
      {activeTab === 'system' && (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 600 }}>
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} /> 系統資訊
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>版本：v1.0.0</p>
              <p>技術棧：Next.js + Prisma + SQLite</p>
              <p>預設管理帳號：admin / admin1234</p>
              <p>目前佈景：{activeTheme.emoji} {activeTheme.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Preview Modal ── */}
      {previewGame && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setPreviewGame(null)}>
          <div style={{ maxWidth: 500, width: '100%', background: 'linear-gradient(145deg, #1a1a2e, #16213e)', borderRadius: 'var(--radius)', padding: '2rem', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewGame(null)}
              style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={18} />
            </button>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem', textAlign: 'center' }}>🎮 試玩模式 — 結果不會記錄</div>
            {previewGame === 'wheel' && <WheelGame prizes={realPrizes.length > 0 ? realPrizes : FALLBACK_PRIZES} onComplete={() => {}} />}
            {previewGame === 'scratch' && <ScratchGame onComplete={() => {}} />}
            {previewGame === 'slot' && <SlotGame onComplete={() => {}} />}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setPreviewGame(null)}>關閉預覽</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
