'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, getCampaigns } from '@/lib/actions';
import { BarChart3, Users, Trophy, TrendingUp, Vote, Eye, Download, MousePointerClick } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

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

  // Merge vote + visitor daily trend for dual-line chart
  const mergedTrend = stats.dailyTrend.map((item, i) => ({
    date: item.date,
    votes: item.count,
    visitors: stats.dailyVisitorTrend[i]?.count || 0,
  }));

  const exportReport = () => {
    if (!stats) return;
    const lines: string[] = [];
    const addLine = (...cols: (string | number)[]) => lines.push(cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));

    // KPI
    addLine('===== KPI 摘要 =====');
    addLine('累計訪客', stats.totalVisitors);
    addLine('今日訪客', stats.todayVisitors);
    addLine('累積投票', stats.totalVotes);
    addLine('投票者數', stats.uniqueDevices);
    addLine('中獎人數', stats.totalWinners);
    addLine('實際派獎率', stats.winRate + '%');
    addLine('');

    // Daily trend
    addLine('===== 每日趨勢 =====');
    addLine('日期', '訪客數', '投票數');
    mergedTrend.forEach(d => addLine(d.date, d.visitors, d.votes));
    addLine('');

    // Project votes
    addLine('===== 作品得票 =====');
    addLine('作品名稱', '得票數', '瀏覽數');
    stats.projectVotes.forEach(p => addLine(p.name, p.votes, p.views || 0));
    addLine('');

    // Inventory
    addLine('===== 獎品庫存 =====');
    addLine('獎品名稱', '剩餘', '總庫存', '消耗率');
    stats.prizeInventory.filter(p => !p.isConsolation).forEach(p => {
      const used = p.totalStock > 0 ? Math.round((1 - p.remaining / p.totalStock) * 100) : 0;
      addLine(p.name, p.remaining, p.totalStock, used + '%');
    });

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `戰情報表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>📊 戰情儀表板</h1>
        <button className="btn btn-outline btn-sm" onClick={exportReport}><Download size={16} /> 匯出報表</button>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-label"><Eye size={14} style={{ display: 'inline', marginRight: 4 }} /> 累計訪客</div>
          <div className="stat-card-value" style={{ color: 'var(--info)' }}>{stats.totalVisitors.toLocaleString()}</div>
          <div className="stat-card-trend" style={{ color: 'var(--success)' }}>
            今日 {stats.todayVisitors} 人
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label"><Vote size={14} style={{ display: 'inline', marginRight: 4 }} /> 累積投票數</div>
          <div className="stat-card-value text-gradient">{stats.totalVotes.toLocaleString()}</div>
          <div className="stat-card-trend" style={{ color: 'var(--text-muted)' }}>
            {stats.uniqueDevices} 位投票者
          </div>
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

      {/* Charts Row 1: Trend + Pie */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-title">📈 每日訪客 vs 投票趨勢（近 14 天）</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mergedTrend}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(value: unknown, name: unknown) => [String(value), name === 'visitors' ? '訪客' : '投票']}
                labelFormatter={label => `日期: ${label}`}
              />
              <Legend formatter={value => value === 'visitors' ? '👁️ 訪客' : '🗳️ 投票'} />
              <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="votes" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">🥧 作品得票分佈</div>
          <ResponsiveContainer width="100%" height={260}>
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

      {/* Charts Row 2: Project Views */}
      <div className="chart-grid" style={{ marginBottom: '2rem' }}>
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-card-title"><MousePointerClick size={16} style={{ display: 'inline', marginRight: 6 }} />作品點閱統計（投票 vs 瀏覽）</div>
          <ResponsiveContainer width="100%" height={Math.max(200, stats.projectVotes.length * 45)}>
            <BarChart data={stats.projectVotes} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(value: unknown, name: unknown) => [String(value), name === 'views' ? '👁️ 瀏覽次數' : '🗳️ 得票數']}
              />
              <Legend formatter={value => value === 'views' ? '👁️ 瀏覽' : '🗳️ 投票'} />
              <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} name="views" />
              <Bar dataKey="votes" fill="#7c3aed" radius={[0, 4, 4, 0]} name="votes" />
            </BarChart>
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
