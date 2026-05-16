'use client';

import { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, getSetting, setSetting } from '@/lib/actions';
import { Plus, Trash2, Power, Edit2, X, Save, Eye, Sparkles, FileText, Info } from 'lucide-react';
import AdminGuide from '@/components/admin/AdminGuide';

type Campaign = Awaited<ReturnType<typeof getCampaigns>>[0];

/* ── Preview: simulates the front-page campaign header ── */
function CampaignPreview({ name, description, details, gameMode }: { name: string; description: string; details: string; gameMode: string }) {
  const gameModeEmoji: Record<string, string> = { wheel: '🎡', scratch: '🎫', slot: '🎰' };
  return (
    <div className="preview-panel">
      <div className="preview-panel-header"><Eye size={14} /> 即時預覽 — 前台首頁</div>
      <div className="preview-viewport" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <span className="badge badge-gold font-en" style={{ fontSize: '0.7rem' }}>VOTE & WIN</span>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.5rem' }}>
          <span className="text-gradient">{name || '活動名稱'}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 auto' }}>
          {description || '活動描述文字預覽'}
        </p>
        {/* Campaign details preview */}
        {details && (
          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)', textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Info size={12} style={{ color: 'var(--info)' }} /> 活動說明
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {details}
            </div>
          </div>
        )}
        <div style={{ marginTop: '1rem', display: 'inline-block', fontSize: '2rem' }}>
          {gameModeEmoji[gameMode] || '🎡'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          遊戲模式：{gameMode === 'wheel' ? '轉盤' : gameMode === 'scratch' ? '刮刮樂' : '拉霸'}
        </div>
      </div>
      <div className="preview-scale-notice">↑ 前台實際顯示效果（等比縮放）</div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', gameMode: 'wheel' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', gameMode: 'wheel' });
  const [details, setDetails] = useState('');         // 活動說明 (create)
  const [editDetails, setEditDetails] = useState(''); // 活動說明 (edit)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => { setCampaigns(await getCampaigns()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newCampaign = await createCampaign(form);
    if (details.trim()) {
      await setSetting(newCampaign.id, 'campaignDetails', details);
    }
    setForm({ name: '', description: '', gameMode: 'wheel' });
    setDetails('');
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleEdit = async (c: Campaign) => {
    setEditId(c.id);
    setEditForm({ name: c.name, description: c.description || '', gameMode: c.gameMode });
    // Load existing details
    const d = await getSetting(c.id, 'campaignDetails');
    setEditDetails(d || '');
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await updateCampaign(editId, editForm);
    await setSetting(editId, 'campaignDetails', editDetails);
    setEditId(null);
    await load();
    setSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateCampaign(id, { isActive: !isActive });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此活動？所有相關資料（作品、獎品、投票、中獎者）都會一併刪除。')) return;
    await deleteCampaign(id);
    load();
  };

  const gameModeLabel: Record<string, string> = { wheel: '🎡 轉盤', scratch: '🎫 刮刮樂', slot: '🎰 拉霸' };

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div className="admin-header">
        <h1>🎪 活動管理</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus size={16} /> 新增活動
        </button>
      </div>

      <AdminGuide
        title="📖 活動管理 — 設定說明"
        items={[
          {
            title: '活動基本設定',
            content: `• 活動名稱：顯示在前台頁面最上方的大標題\n• 活動描述：顯示在標題下方的副標題文字\n• 活動說明：顯示在 Banner 與獎品之間的詳細說明區\n\n提示：活動說明支援多行文字，可用於寫活動規則、時間等資訊`,
          },
          {
            title: '💡 遊戲模式選擇',
            content: `• 🎡 轉盤：經典轉盤抽獎，指針停下位置即為結果\n• 🎫 刮刮樂：刮開銀色區域揭曉結果\n• 🎰 拉霸：三個輪盤旋轉後對齊看結果\n\n三種遊戲的抽獎機率相同，均由後台「獎品管理」的權重設定決定`,
          },
          {
            title: '💡 活動狀態管理',
            content: `• 點擊電源按鈕可切換活動「進行中 / 已停用」\n• 同一時間可有多個活動，但前台僅顯示「進行中」且最新建立的活動\n• 停用活動不會刪除資料，可隨時重新啟用`,
          },
        ]}
      />

      {/* ── Create Form with Preview ── */}
      {showForm && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side">
            <div className="admin-panel-title">✨ 新增活動</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>活動名稱</label>
                <input placeholder="例：2026 年度人氣票選活動" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>活動描述（選填，顯示於標題下方）</label>
                <input placeholder="例：選出您最喜愛的作品，投票即可參加幸運抽獎！" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={13} /> 活動說明（選填，顯示於 Banner 與獎品之間）
                </label>
                <textarea
                  placeholder={`例：\n📅 活動期間：2026/05/01 ~ 2026/06/30\n📌 每人可投票 3 個作品\n🎁 投票後即可參加抽獎\n\n✨ 感謝您的參與！`}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>遊戲模式</label>
                <select value={form.gameMode} onChange={e => setForm(f => ({ ...f, gameMode: e.target.value }))}>
                  <option value="wheel">🎡 轉盤</option>
                  <option value="scratch">🎫 刮刮樂</option>
                  <option value="slot">🎰 拉霸</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '建立中...' : '建立'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          </div>
          <CampaignPreview name={form.name} description={form.description} details={details} gameMode={form.gameMode} />
        </div>
      )}

      {/* ── Edit Form with Preview ── */}
      {editId && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
            <div className="admin-panel-title"><Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />編輯活動</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>活動名稱</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>活動描述（顯示於標題下方）</label>
                <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={13} /> 活動說明（顯示於 Banner 與獎品之間）
                </label>
                <textarea
                  placeholder="輸入活動說明內容...（支援多行文字）"
                  value={editDetails}
                  onChange={e => setEditDetails(e.target.value)}
                  rows={5}
                  style={{ resize: 'vertical', minHeight: 100 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>遊戲模式</label>
                <select value={editForm.gameMode} onChange={e => setEditForm(f => ({ ...f, gameMode: e.target.value }))}>
                  <option value="wheel">🎡 轉盤</option>
                  <option value="scratch">🎫 刮刮樂</option>
                  <option value="slot">🎰 拉霸</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                  <Save size={14} /> {saving ? '儲存中...' : '儲存'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          </div>
          <CampaignPreview name={editForm.name} description={editForm.description} details={editDetails} gameMode={editForm.gameMode} />
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>活動名稱</th><th>遊戲模式</th><th>投票數</th><th>中獎數</th><th>狀態</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} style={{ background: editId === c.id ? 'rgba(124,58,237,0.08)' : undefined }}>
              <td>
                <strong>{c.name}</strong>
                {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.description}</div>}
              </td>
              <td>{gameModeLabel[c.gameMode] || c.gameMode}</td>
              <td className="font-en">{c._count.votes}</td>
              <td className="font-en">{c._count.winners}</td>
              <td>
                <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {c.isActive ? '進行中' : '已停用'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)} title="編輯">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggle(c.id, c.isActive)} title={c.isActive ? '停用' : '啟用'}>
                    <Power size={14} />
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)} title="刪除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {campaigns.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>尚無活動</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
