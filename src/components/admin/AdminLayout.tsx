'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FolderOpen, Trophy, Image, Users, Settings, LogOut, Ticket, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: '戰情儀表板' },
  { href: '/admin/campaigns', icon: Ticket, label: '活動管理' },
  { href: '/admin/projects', icon: FolderOpen, label: '作品管理' },
  { href: '/admin/prizes', icon: Trophy, label: '獎品管理' },
  { href: '/admin/banners', icon: Image, label: 'Banner 管理' },
  { href: '/admin/winners', icon: Users, label: '中獎者管理' },
  { href: '/admin/settings', icon: Settings, label: '系統設定' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) setAuthenticated(true);
    setChecking(false);
  }, []);

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--admin-bg)' }}><p>載入中...</p></div>;

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2>🎰 Lucky Admin</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>投票抽獎管理中心</p>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--admin-border)' }}>
          <button className="admin-nav-item" style={{ width: '100%', color: 'var(--danger)' }}
            onClick={() => { sessionStorage.removeItem('admin_token'); setAuthenticated(false); }}>
            <LogOut size={18} /> 登出
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_token', data.token);
        onLogin();
      } else { setError(data.error || '登入失敗'); }
    } catch { setError('連線失敗'); }
    finally { setLoading(false); }
  };

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}><span className="text-gradient">管理員登入</span></h1>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">帳號</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
          </div>
          <div className="form-group">
            <label className="form-label">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          預設帳密：admin / admin1234
        </p>
      </div>
    </div>
  );
}
