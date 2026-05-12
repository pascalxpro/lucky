'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, getCampaigns } from '@/lib/actions';
import { BarChart3, Users, Trophy, TrendingUp, Vote, Eye, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const campaigns = await getCampaigns();
        const active = campaigns.find(c => c.isActive);
        if (active) {
          const data = await getDashboardStats(active.id);
          setStats(data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><p>載入中...</p></div>;
  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center' }}><p>尚無進行中的活動</p></div>;

  return (
    <div>
      <div className="admin-header">
        <h1>📊 戰情儀表板</h1>
        <button className="btn btn-outline btn-sm"><Download size={16} /> 匯出報表</button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label"><Vote size={14} style={{ display: 'inline', marginRight: 4 }} /> 累積投票數</div>
          <div className="stat-card-value text-gradient">{stats.totalVotes.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label"><Eye size={14} style={{ display: 'inline', marginRight: 4 }} /> 獨立訪客</div>
          <div className="stat-card-value" style={{ color: 'var(--info)' }}>{stats.uniqueDevices.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label"><Trophy size={14} style={{ display: 'inline', marginRight: 4 }} /> 中獎人數</div>
          <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{stats.totalWinners.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label"><TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> 實際派獎率</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats.winRate}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-title">📈 每日投票趨勢（近 14 天）</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.dailyTrend}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">🥧 作品得票分佈</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.projectVotes} dataKey="votes" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {stats.projectVotes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory */}
      <div className="admin-panel">
        <div className="admin-panel-title">📦 獎品庫存水位</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stats.prizeInventory.filter(p => !p.isConsolation).map((prize, i) => {
            const pct = prize.totalStock > 0 ? (prize.remaining / prize.totalStock) * 100 : 0;
            const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--accent)' : 'var(--danger)';
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span>{prize.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{prize.remaining} / {prize.totalStock}</span>
                </div>
                <div className="inventory-bar">
                  <div className="inventory-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
