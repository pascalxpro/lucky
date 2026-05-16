'use client';

import { useState, useEffect } from 'react';
import { getWinners, updateWinnerStatus, updateWinnerInfo, deleteWinner } from '@/lib/actions';
import { Download, CheckCircle, Truck, Clock, Edit2, Save, X, Trash2 } from 'lucide-react';
import AdminGuide from '@/components/admin/AdminGuide';

type Winner = Awaited<ReturnType<typeof getWinners>>[0];

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [filter, setFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ userName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => { setWinners(await getWinners()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? winners : winners.filter(w => w.status === filter);

  const statusLabel: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    pending: { label: '待確認', badge: 'badge-gold', icon: <Clock size={10} /> },
    confirmed: { label: '已確認', badge: 'badge-primary', icon: <CheckCircle size={10} /> },
    shipped: { label: '已寄出', badge: 'badge-success', icon: <Truck size={10} /> },
  };

  const handleStatus = async (id: string, status: string) => {
    await updateWinnerStatus(id, status);
    load();
  };

  const handleEdit = (w: Winner) => {
    setEditId(w.id);
    setEditForm({ userName: w.userName || '', phone: w.phone || '', address: w.address || '' });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await updateWinnerInfo(editId, editForm);
    setEditId(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此中獎紀錄？此操作無法復原。')) return;
    await deleteWinner(id);
    load();
  };

  const exportCSV = () => {
    if (winners.length === 0) return alert('尚無中獎者資料可匯出');
    const statusMap: Record<string, string> = { pending: '待確認', confirmed: '已確認', shipped: '已寄出' };
    const header = ['獎品名稱', '類型', '姓名', '電話', '地址', '中獎時間', '狀態'];
    const rows = winners.filter(w => !w.prize.isConsolation).map(w => [
      w.prize.name,
      w.prize.isConsolation ? '安慰獎' : '正式獎',
      w.userName || '',
      w.phone || '',
      w.address || '',
      new Date(w.createdAt).toLocaleString('zh-TW'),
      statusMap[w.status] || w.status,
    ]);
    const csv = '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `中獎者名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      <div className="admin-header">
        <h1>👑 中獎者管理</h1>
        <button className="btn btn-outline btn-sm" onClick={exportCSV}><Download size={16} /> 匯出名單</button>
      </div>

      <AdminGuide
        title="📖 中獎者管理 — 設定說明"
        items={[
          {
            title: '中獎者狀態流程',
            content: `每位中獎者會依序經過三個狀態：\n\n⏳ 待確認：剛中獎，等待中獎者填寫個資或管理員核實\n✅ 已確認：個資已確認，準備寄送獎品\n🚚 已寄出：獎品已寄出，派獎完成`,
          },
          {
            title: '💡 操作說明',
            content: `• 筆型按鈕：編輯中獎者的姓名、電話、地址\n• ✅ 按鈕：將狀態從「待確認」提升為「已確認」\n• 🚚 按鈕：將狀態從「已確認」提升為「已寄出」\n• 垃圾桶按鈕：刪除中獎紀錄（不可復原）\n\n提示：安慰獎中獎者會以半透明顯示，因為不需實際派獎`,
          },
          {
            title: '💡 篩選與匯出',
            content: `• 上方篩選按鈕可快速查看各狀態的中獎者\n• 「匯出名單」可下載正式獎中獎者資料（CSV 格式，可用 Excel 開啟）\n• 建議定期檢查「待確認」的中獎者，及時聯繫派獎`,
          },
        ]}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'shipped'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `全部 (${winners.length})` : `${statusLabel[f]?.label} (${winners.filter(w => w.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Edit panel */}
      {editId && (
        <div className="admin-panel" style={{ marginBottom: '1.5rem', borderColor: 'var(--primary)', borderWidth: 2 }}>
          <div className="admin-panel-title"><Edit2 size={14} style={{ display: 'inline', marginRight: 6 }} />編輯中獎者資料</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>姓名</label>
              <input value={editForm.userName} onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))} placeholder="中獎者姓名" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>電話</label>
              <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="聯絡電話" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>地址</label>
              <input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="寄送地址" />
            </div>
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
      )}

      <table className="data-table">
        <thead>
          <tr><th>獎品</th><th>姓名</th><th>電話</th><th>地址</th><th>中獎時間</th><th>狀態</th><th>操作</th></tr>
        </thead>
        <tbody>
          {filtered.map(w => {
            const st = statusLabel[w.status] || statusLabel.pending;
            const isReal = !w.prize.isConsolation;
            return (
              <tr key={w.id} style={{ opacity: isReal ? 1 : 0.5, background: editId === w.id ? 'rgba(124,58,237,0.08)' : undefined }}>
                <td>
                  <strong>{w.prize.name}</strong>
                  {w.prize.isConsolation && <span className="badge badge-primary" style={{ marginLeft: 6, fontSize: '0.65rem' }}>安慰獎</span>}
                </td>
                <td>{w.userName || '—'}</td>
                <td className="font-en">{w.phone || '—'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.address || '—'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleString('zh-TW')}</td>
                <td><span className={`badge ${st.badge}`}>{st.icon} {st.label}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {isReal && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(w)} title="編輯資料">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {isReal && w.status === 'pending' && w.userName && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleStatus(w.id, 'confirmed')} title="確認">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {isReal && w.status === 'confirmed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleStatus(w.id, 'shipped')} title="寄出">
                        <Truck size={14} />
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(w.id)} title="刪除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>無資料</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
