import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';
import Sidebar from '../shared/Sidebar';
import { Activity, AlertTriangle, Clock, Zap, CheckCircle, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [profile, setProfile] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 15000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, actRes, profileRes] = await Promise.all([
        userApi.getDashboard(),
        userApi.getActivity(),
        userApi.getProfile(),
      ]);
      setData(dashRes.data);
      setActivity(actRes.data || []);
      setProfile(profileRes.data);
    } catch (_) {}
  };

  const runTestApi = async () => {
    setTesting(true);
    try {
      const res = await userApi.testApi();
      setTestResult({ ok: true, msg: 'API call tracked successfully' });
      loadData();
    } catch (err) {
      setTestResult({ ok: false, msg: err.response?.data?.error || 'API call failed' });
    }
    setTesting(false);
    setTimeout(() => setTestResult(null), 4000);
  };

  const statusData = activity.slice(0, 10).map((l, i) => ({
    name: i,
    status: l.statusCode,
    time: l.responseTimeMs || 0,
  }));

  return (
    <div style={styles.layout}>
      <Sidebar role="USER" />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome, {profile?.username}</h1>
            <p style={styles.sub}>Your security overview — last 24 hours</p>
          </div>
          <button onClick={runTestApi} disabled={testing} style={styles.testBtn}>
            <Play size={14} />
            {testing ? 'Running...' : 'Test API Call'}
          </button>
        </div>

        {testResult && (
          <div style={{
            ...styles.testResult,
            borderColor: testResult.ok ? '#22cc7750' : '#ff444450',
            color: testResult.ok ? '#22cc77' : '#ff6666',
          }}>
            {testResult.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {testResult.msg}
          </div>
        )}

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: 'Total Requests', value: data?.totalRequests || 0, icon: Activity, color: '#00d4ff' },
            { label: 'Failed Requests', value: data?.failedRequests || 0, icon: AlertTriangle, color: '#ffaa00' },
            { label: 'Threats Detected', value: data?.threatsDetected || 0, icon: Zap, color: '#ff4444' },
            { label: 'Avg Response', value: `${Math.round(data?.avgResponseTime || 0)}ms`, icon: Clock, color: '#22cc77' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: `${s.color}15`, color: s.color }}>
                <s.icon size={18} />
              </div>
              <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Score */}
        {profile && (
          <div style={styles.riskCard}>
            <div>
              <div style={styles.riskLabel}>Your Risk Score</div>
              <div style={styles.riskDesc}>Based on AI behavioral analysis</div>
            </div>
            <div style={styles.riskMeter}>
              <div style={styles.riskBar}>
                <div style={{
                  ...styles.riskFill,
                  width: `${(profile.riskScore || 0) * 100}%`,
                  background: profile.riskScore > 0.6 ? '#ff4444' : profile.riskScore > 0.3 ? '#ffaa00' : '#22cc77',
                }} />
              </div>
              <div style={styles.riskPct}>{((profile.riskScore || 0) * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}

        <div style={styles.chartsRow}>
          {/* Response Times */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Response Times (ms)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#0d1929', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="time" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div style={styles.activityCard}>
            <h3 style={styles.chartTitle}>Recent Activity</h3>
            <div style={styles.activityList}>
              {activity.slice(0, 6).map((log, i) => (
                <div key={i} style={styles.activityRow}>
                  <div style={{
                    ...styles.methodBadge,
                    color: log.method === 'GET' ? '#00d4ff' : log.method === 'POST' ? '#22cc77' : '#ffaa00'
                  }}>
                    {log.method}
                  </div>
                  <div style={styles.endpoint}>{log.endpoint}</div>
                  <div style={{
                    ...styles.status,
                    color: log.statusCode < 400 ? '#22cc77' : '#ff6666'
                  }}>
                    {log.statusCode}
                  </div>
                  {log.threatDetected && <Zap size={12} color="#ff4444" />}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
  sub: { color: '#8899aa', fontSize: '12px', margin: '4px 0 0 0' },
  testBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', padding: '10px 18px', color: '#00d4ff', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer' },
  testResult: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '12px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
  statCard: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' },
  statIcon: { padding: '10px', borderRadius: '8px', display: 'flex' },
  statVal: { fontSize: '26px', fontWeight: '700' },
  statLabel: { color: '#8899aa', fontSize: '11px' },
  riskCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  riskLabel: { color: '#fff', fontSize: '14px', fontWeight: '600' },
  riskDesc: { color: '#8899aa', fontSize: '11px', marginTop: '4px' },
  riskMeter: { display: 'flex', alignItems: 'center', gap: '12px' },
  riskBar: { width: '200px', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s' },
  riskPct: { color: '#fff', fontSize: '16px', fontWeight: '700', minWidth: '40px' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  chartCard: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' },
  chartTitle: { color: '#fff', fontSize: '13px', margin: '0 0 16px 0', fontWeight: '600' },
  activityCard: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  activityRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' },
  methodBadge: { fontSize: '10px', fontWeight: '700', minWidth: '36px', letterSpacing: '0.05em' },
  endpoint: { flex: 1, color: '#8899aa', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  status: { fontSize: '11px', fontWeight: '600', minWidth: '28px', textAlign: 'right' },
};

export default UserDashboard;