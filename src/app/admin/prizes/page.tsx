'use client';

import { useState, useEffect } from 'react';
import { getCampaigns, getPrizes, createPrize, updatePrize, deletePrize } from '@/lib/actions';
import { Plus, Trash2, AlertTriangle, Lock, Edit2, Save, X, Eye, Trophy } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import AdminGuide from '@/components/admin/AdminGuide';

type Prize = Awaited<ReturnType<typeof getPrizes>>[0];

/* ── Preview: simulates the prize showcase card on front-page ── */
function PrizePreview({ name, imageUrl, isConsolation, probability, totalWeight, rank }: {
  name: string; imageUrl: string; isConsolation: boolean;
  probability: number; totalWeight: number; rank: number;
}) {
  const pct = totalWeight > 0 ? ((probability / totalWeight) * 100).toFixed(1) : '0';
  const emoji = isConsolation ? '🎈' : rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '🎁';
  const isTop = rank === 0 && !isConsolation;
  return (
    <div className="preview-panel">
      <div className="preview-panel-header"><Eye size={14} /> 即時預覽 — 獎品展示</div>
      <div className="preview-viewport" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Trophy size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-gold">豐富獎品等你拿</span>
        </h2>
        <div className="glass-card" style={{
          padding: 0, display: 'inline-block', textAlign: 'center',
          width: 200, overflow: 'hidden',
          border: isTop ? '2px solid var(--accent)' : undefined,
          boxShadow: isTop ? '0 8px 30px rgba(255,184,0,0.2)' : undefined,
        }}>
          {/* Prize Image */}
          <div style={{
            width: '100%', aspectRatio: '1', overflow: 'hidden',
            background: 'var(--gradient-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
            )}
            {/* Rank badge */}
            <div style={{
              position: 'absolute', top: 8, left: 8,
              width: 28, height: 28, borderRadius: '50%',
              background: rank === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                          rank === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                          rank === 2 ? 'linear-gradient(135deg, #CD7F32, #A0522D)' :
                          'var(--glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, color: rank < 3 ? '#1a1a2e' : 'var(--text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-en)',
            }}>
              {rank + 1}
            </div>
          </div>
          {/* Prize name */}
          <div style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
            {name || '獎品名稱'}
            {isConsolation && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>安慰獎</div>}
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>中獎率 <span className="font-en" style={{ fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span></div>
        </div>
      </div>
      <div className="preview-scale-notice">↑ 前台獎品展示效果（等比縮放）</div>
    </div>
  );
}

export default function PrizesPage() {
  const [campaignId, setCampaignId] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', totalStock: 10, probability: 10, isConsolation: false, requireClaimInfo: true, imageUrl: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', totalStock: 10, remaining: 10, probability: 10, isConsolation: false, requireClaimInfo: true, imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const campaigns = await getCampaigns();
      const active = campaigns.find(c => c.isActive);
      if (active) { setCampaignId(active.id); setPrizes(await getPrizes(active.id)); }
      setLoading(false);
    })();
  }, []);

  const load = async () => { if (campaignId) setPrizes(await getPrizes(campaignId)); };

  const totalWeight = prizes.reduce((s, p) => s + p.probability, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await createPrize({ campaignId, ...form, remaining: form.totalStock });
    setForm({ name: '', totalStock: 10, probability: 10, isConsolation: false, requireClaimInfo: true, imageUrl: '' });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleEdit = (p: Prize) => {
    setEditId(p.id);
    setEditForm({
      name: p.name, totalStock: p.totalStock, remaining: p.remaining,
      probability: p.probability, isConsolation: p.isConsolation, requireClaimInfo: p.requireClaimInfo, imageUrl: p.imageUrl || '',
    });
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await updatePrize(editId, editForm);
    setEditId(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此獎品？相關中獎紀錄也會一併刪除。')) return;
    await deletePrize(id);
    load();
  };

  const handleProbUpdate = async (id: string, probability: number) => {
    await updatePrize(id, { probability });
    load();
  };

  // compute preview rank for form/edit
  const editIndex = editId ? prizes.findIndex(p => p.id === editId) : prizes.length;

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div className="admin-header">
        <h1>🏆 獎品 & 機率引擎</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus size={16} /> 新增獎品
        </button>
      </div>

      {/* Probability summary */}
      <div className="admin-panel" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>權重總和：</span>
        <span className="font-en" style={{ fontSize: '1.2rem', fontWeight: 700, color: totalWeight === 100 ? 'var(--success)' : 'var(--accent)' }}>
          {totalWeight.toFixed(3)}
        </span>
        {totalWeight !== 100 && (
          <span className="badge badge-gold"><AlertTriangle size={12} /> 建議調整至 100</span>
        )}
      </div>

      <AdminGuide
        title="📖 獎品 & 機率引擎 — 設定說明"
        items={[
          {
            title: '機率權重是什麼？',
            content: `機率權重決定每個獎品被抽到的機率。\n\n計算方式：中獎率 = 該獎品權重 ÷ 所有獎品權重總和 × 100%\n\n建議將所有獎品的權重總和設為 100，方便直覺計算。\n例如權重設為 5，則中獎率就是 5%。`,
          },
          {
            title: '💡 權重設定範例',
            content: `假設您有 6 個獎項（權重總和 = 100）：\n\n🥇 頭獎 iPhone 16 Pro → 權重 2（中獎率 2%）\n🥈 二獎 AirPods Pro → 權重 5（中獎率 5%）\n🥉 三獎 禮券 $500 → 權重 13（中獎率 13%）\n🎁 四獎 精美小禮物 → 權重 20（中獎率 20%）\n🎈 安慰獎 折價券 → 權重 25（中獎率 25%）\n😊 再接再厲（未中獎）→ 權重 35（中獎率 35%）\n\n提示：權重也支援小數，例如 0.5 表示中獎率 0.5%`,
          },
          {
            title: '💡 庫存與剩餘數量',
            content: `• 總庫存：該獎品的原始數量\n• 剩餘數量：目前還可派出的數量，每次中獎自動扣 1\n• 當剩餘歸零時，該獎品會被「鎖定」，系統自動跳過不再抽出\n\n安慰獎的庫存通常設為很大的數字（如 99999），因為不需限量`,
          },
          {
            title: '💡 安慰獎 vs 正式獎品',
            content: `• 勾選「安慰獎」的獎項不會顯示在前台獎品展示區\n• 安慰獎的庫存不會被消耗（等同無限量供應）\n• 建議至少設定一個安慰獎或「未中獎」項目\n• 「中獎需填個資」可依獎品個別設定，例如小禮物可以免填`,
          },
        ]}
      />

      {/* ── Create Form with Preview ── */}
      {showForm && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side">
            <div className="admin-panel-title">✨ 新增獎品</div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>獎品名稱</label>
                <input placeholder="例：iPhone 16 Pro" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                  label="獎品圖片（選填）"
                  hint="建議尺寸：200 × 200 px（1:1）"
                  maxWidth={400}
                  maxHeight={400}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>庫存數量</label>
                <input type="number" value={form.totalStock} onChange={e => setForm(f => ({ ...f, totalStock: Number(e.target.value) }))} min={0} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>機率權重</label>
                <input type="number" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} min={0} step={0.001} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={form.isConsolation} onChange={e => setForm(f => ({ ...f, isConsolation: e.target.checked }))} style={{ width: 'auto' }} />
                安慰獎 / 未中獎
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', gridColumn: '1 / -1', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: form.requireClaimInfo ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${form.requireClaimInfo ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                <input type="checkbox" checked={form.requireClaimInfo} onChange={e => setForm(f => ({ ...f, requireClaimInfo: e.target.checked }))} style={{ width: 'auto' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>中獎需填個資</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    {form.requireClaimInfo ? '✅ 中獎後需填寫姓名、手機、地址' : '⚠️ 中獎後僅顯示恭喜訊息'}
                  </div>
                </div>
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '建立中...' : '建立'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          </div>
          <PrizePreview
            name={form.name} imageUrl={form.imageUrl} isConsolation={form.isConsolation}
            probability={form.probability} totalWeight={totalWeight + form.probability} rank={prizes.length}
          />
        </div>
      )}

      {/* ── Edit Form with Preview ── */}
      {editId && (
        <div className="edit-with-preview" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-panel edit-form-side" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
            <div className="admin-panel-title"><Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />編輯獎品</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>獎品名稱</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <ImageUploader
                  value={editForm.imageUrl}
                  onChange={url => setEditForm(f => ({ ...f, imageUrl: url }))}
                  label="獎品圖片"
                  hint="建議尺寸：200 × 200 px（1:1）"
                  maxWidth={400}
                  maxHeight={400}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>總庫存</label>
                <input type="number" value={editForm.totalStock} onChange={e => setEditForm(f => ({ ...f, totalStock: Number(e.target.value) }))} min={0} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>剩餘數量</label>
                <input type="number" value={editForm.remaining} onChange={e => setEditForm(f => ({ ...f, remaining: Number(e.target.value) }))} min={0} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>機率權重</label>
                <input type="number" value={editForm.probability} onChange={e => setEditForm(f => ({ ...f, probability: Number(e.target.value) }))} min={0} step={0.001} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={editForm.isConsolation} onChange={e => setEditForm(f => ({ ...f, isConsolation: e.target.checked }))} style={{ width: 'auto' }} />
                  安慰獎
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', gridColumn: '1 / -1', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: editForm.requireClaimInfo ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${editForm.requireClaimInfo ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                <input type="checkbox" checked={editForm.requireClaimInfo} onChange={e => setEditForm(f => ({ ...f, requireClaimInfo: e.target.checked }))} style={{ width: 'auto' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>中獎需填個資</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    {editForm.requireClaimInfo ? '✅ 中獎後需填寫姓名、手機、地址' : '⚠️ 中獎後僅顯示恭喜訊息'}
                  </div>
                </div>
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                  <Save size={14} /> {saving ? '儲存中...' : '儲存'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          </div>
          <PrizePreview
            name={editForm.name} imageUrl={editForm.imageUrl} isConsolation={editForm.isConsolation}
            probability={editForm.probability} totalWeight={totalWeight} rank={editIndex}
          />
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr><th>獎品名稱</th><th>庫存</th><th>剩餘</th><th>已派出</th><th>機率權重</th><th>實際機率</th><th>領獎</th><th>狀態</th><th>操作</th></tr>
        </thead>
        <tbody>
          {prizes.map(p => {
            const pct = totalWeight > 0 ? ((p.probability / totalWeight) * 100).toFixed(3) : '0';
            const outOfStock = p.remaining <= 0 && !p.isConsolation;
            return (
              <tr key={p.id} style={{ opacity: outOfStock ? 0.5 : 1, background: editId === p.id ? 'rgba(124,58,237,0.08)' : undefined }}>
                <td>
                  <strong>{p.name}</strong>
                  {p.isConsolation && <span className="badge badge-primary" style={{ marginLeft: 8 }}>安慰獎</span>}
                </td>
                <td className="font-en">{p.totalStock}</td>
                <td className="font-en" style={{ color: p.remaining <= 3 && !p.isConsolation ? 'var(--danger)' : 'inherit', fontWeight: 700 }}>
                  {p.remaining}
                </td>
                <td className="font-en">{p._count.winners}</td>
                <td>
                  <input
                    type="number" value={p.probability} step={0.001} min={0} style={{ width: 80, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                    onChange={e => handleProbUpdate(p.id, Number(e.target.value))}
                  />
                </td>
                <td className="font-en" style={{ fontWeight: 600 }}>{pct}%</td>
                <td>
                  {p.requireClaimInfo ? (
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>📋 需填資料</span>
                  ) : (
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>🎊 免填</span>
                  )}
                </td>
                <td>
                  {outOfStock ? (
                    <span className="badge badge-danger"><Lock size={10} /> 已鎖定</span>
                  ) : (
                    <span className="badge badge-success">可用</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)} title="編輯">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id)} title="刪除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
