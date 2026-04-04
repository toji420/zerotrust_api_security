import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import Sidebar from '../shared/Sidebar';
import {
  Shield, Users, AlertTriangle, Activity, TrendingUp,
  Ban, CheckCircle, XCircle, Clock, Zap
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{ ...styles.statCard, borderColor: `${color}30` }}>
    <div style={{ ...styles.statIcon, background: `${color}15`, color }}>
      <Icon size={20} />
    </div>
    <div style={styles.statBody}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, threatsRes, usersRes, logsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentThreats(),
        adminApi.getAllUsers(),
        adminApi.getRecentLogs(),
      ]);
      setStats(statsRes.data);
      setThreats(threatsRes.data || []);
      setUsers(usersRes.data || []);
      setLogs(logsRes.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleBlock = async (username) => {
    await adminApi.blockUser(username, 'Manually blocked by admin');
    loadData();
  };

  const handleUnblock = async (username) => {
    await adminApi.unblockUser(username);
    loadData();
  };

  const getSeverityColor = (s) => ({
    CRITICAL: '#ff2255', HIGH: '#ff6600', MEDIUM: '#ffaa00', LOW: '#00ccff'
  }[s] || '#8899aa');

  const threatChartData = threats.slice(0, 10).reverse().map((t, i) => ({
    name: i.toString(),
    score: Math.round(t.anomalyScore * 100),
  }));

  const roleDistribution = [
    { name: 'Users', value: users.filter(u => u.role === 'USER').length },
    { name: 'Admins', value: users.filter(u => u.role === 'ADMIN').length },
  ];

  if (loading) return (
    <div style={styles.layout}>
      <Sidebar role="ADMIN" />
      <div style={styles.loadingMain}>
        <div style={styles.loadingText}>Loading security intelligence...</div>
      </div>
    </div>
  );

  return (
    <div style={styles.layout}>
      <Sidebar role="ADMIN" />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Security Dashboard</h1>
            <p style={styles.pageDesc}>Real-time threat monitoring & policy enforcement</p>
          </div>
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            <span style={styles.liveText}>LIVE</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="#00d4ff" />
          <StatCard icon={CheckCircle} label="Active Users" value={stats?.activeUsers || 0} color="#22cc77" />
          <StatCard icon={Ban} label="Blocked Users" value={stats?.blockedUsers || 0} color="#ff4444" sub="Auto-blocked" />
          <StatCard icon={AlertTriangle} label="Threats Today" value={stats?.threatsToday || 0} color="#ff8800" />
          <StatCard icon={Zap} label="Active Threats" value={stats?.activeThreats || 0} color="#ff2255" sub="Last 1hr" />
          <StatCard icon={Activity} label="Total Threats" value={stats?.totalThreats || 0} color="#aa88ff" />
        </div>

        <div style={styles.chartsRow}>
          {/* Anomaly Score Timeline */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Anomaly Score Timeline</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={threatChartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: '#0d1929', border: '1px solid #ff4444', borderRadius: '8px', fontSize: '12px' }}
                  formatter={v => [`${v}%`, 'Score']}
                />
                <Area type="monotone" dataKey="score" stroke="#ff4444" fill="url(#scoreGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* User Distribution */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>User Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  <Cell fill="#00d4ff" />
                  <Cell fill="#aa88ff" />
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1929', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.tablesRow}>
          {/* Recent Threats */}
          <div style={styles.tableCard}>
            <h3 style={styles.tableTitle}>
              <AlertTriangle size={16} color="#ff8800" />
              Recent Threats
            </h3>
            <div style={styles.tableBody}>
              {threats.length === 0 ? (
                <div style={styles.empty}>No threats detected</div>
              ) : threats.slice(0, 8).map(t => (
                <div key={t.id} style={styles.threatRow}>
                  <div style={{ ...styles.severityBadge, background: `${getSeverityColor(t.severity)}20`, color: getSeverityColor(t.severity) }}>
                    {t.severity}
                  </div>
                  <div style={styles.threatDetails}>
                    <div style={styles.threatType}>{t.threatType}</div>
                    <div style={styles.threatUser}>@{t.username}</div>
                  </div>
                  <div style={styles.threatScore}>{Math.round(t.anomalyScore * 100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Management */}
          <div style={styles.tableCard}>
            <h3 style={styles.tableTitle}>
              <Users size={16} color="#00d4ff" />
              User Management
            </h3>
            <div style={styles.tableBody}>
              {users.slice(0, 8).map(u => (
                <div key={u.id} style={styles.userRow}>
                  <div>
                    <div style={styles.uName}>{u.username}</div>
                    <div style={styles.uRole}>{u.role}</div>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    background: u.status === 'ACTIVE' ? '#22cc7720' : '#ff444420',
                    color: u.status === 'ACTIVE' ? '#22cc77' : '#ff4444'
                  }}>
                    {u.status}
                  </div>
                  <div style={styles.actionBtns}>
                    {u.status === 'BLOCKED' ? (
                      <button onClick={() => handleUnblock(u.username)} style={styles.unblockBtn}>
                        <CheckCircle size={13} /> Unblock
                      </button>
                    ) : (
                      u.role !== 'ADMIN' && (
                        <button onClick={() => handleBlock(u.username)} style={styles.blockBtn}>
                          <XCircle size={13} /> Block
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#050a14', fontFamily: "'JetBrains Mono', monospace" },
  main: { flex: 1, padding: '28px', overflow: 'auto' },
  loadingMain: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#00d4ff', fontSize: '14px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  pageTitle: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
  pageDesc: { color: '#8899aa', fontSize: '12px', margin: '4px 0 0 0' },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 204, 119, 0.1)', border: '1px solid rgba(34,204,119,0.2)', borderRadius: '20px', padding: '6px 14px' },
  liveDot: { width: '8px', height: '8px', background: '#22cc77', borderRadius: '50%', animation: 'pulse 2s infinite' },
  liveText: { color: '#22cc77', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' },
  statCard: { background: '#0a1628', border: '1px solid', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' },
  statIcon: { padding: '10px', borderRadius: '8px', display: 'flex' },
  statBody: {},
  statValue: { fontSize: '22px', fontWeight: '700' },
  statLabel: { color: '#8899aa', fontSize: '11px', marginTop: '2px' },
  statSub: { color: '#556677', fontSize: '10px' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  chartCard: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' },
  chartTitle: { color: '#fff', fontSize: '13px', margin: '0 0 16px 0', fontWeight: '600' },
  tablesRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  tableCard: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' },
  tableTitle: { display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', margin: '0 0 16px 0', fontWeight: '600' },
  tableBody: { display: 'flex', flexDirection: 'column', gap: '8px' },
  empty: { color: '#556677', fontSize: '12px', textAlign: 'center', padding: '20px' },
  threatRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' },
  severityBadge: { padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', minWidth: '64px', textAlign: 'center' },
  threatDetails: { flex: 1 },
  threatType: { color: '#ddd', fontSize: '12px' },
  threatUser: { color: '#8899aa', fontSize: '11px' },
  threatScore: { color: '#ff8800', fontSize: '13px', fontWeight: '700' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' },
  uName: { color: '#ddd', fontSize: '12px' },
  uRole: { color: '#556677', fontSize: '10px' },
  statusBadge: { padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' },
  actionBtns: { marginLeft: 'auto' },
  blockBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '6px', padding: '4px 10px', color: '#ff6666', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer' },
  unblockBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 204, 119, 0.1)', border: '1px solid rgba(34,204,119,0.2)', borderRadius: '6px', padding: '4px 10px', color: '#22cc77', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer' },
};

export default AdminDashboard;