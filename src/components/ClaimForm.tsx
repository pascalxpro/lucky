'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ClaimForm({ winnerId, prizeName, onBack }: { winnerId: string; prizeName: string; onBack: () => void }) {
  const [form, setForm] = useState({ userName: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.userName.trim()) e.userName = '請輸入姓名';
    if (!form.phone.trim()) e.phone = '請輸入手機號碼';
    else if (!/^09\d{8}$/.test(form.phone)) e.phone = '請輸入正確格式 (09xxxxxxxx)';
    if (!form.address.trim()) e.address = '請輸入收件地址';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, ...form }),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else alert(data.error || '提交失敗');
    } catch { alert('提交失敗，請稍後再試'); }
    finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-content win" style={{ animation: 'scaleIn 0.4s ease' }}>
          <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>資料已送出！</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>我們會盡快將獎品寄送給您，請留意手機通知。</p>
          <button className="btn btn-primary" onClick={onBack}>返回活動頁面</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <button onClick={onBack} className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="claim-form glass-card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <span className="text-gold">領獎資料填寫</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>您的獎品：<strong>{prizeName}</strong></p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input value={form.userName} onChange={e => setForm(f => ({ ...f, userName: e.target.value }))} placeholder="請輸入您的姓名" />
              {errors.userName && <p className="form-error">{errors.userName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">手機號碼 *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09xxxxxxxx" />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">收件地址 *</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="請輸入完整收件地址" />
              {errors.address && <p className="form-error">{errors.address}</p>}
            </div>
            <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
              {submitting ? '提交中...' : '確認送出'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
