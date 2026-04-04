import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import Sidebar from '../shared/Sidebar';
import { AlertTriangle, Zap, Clock } from 'lucide-react';

const severityColor = (s) => ({
  CRITICAL: '#ff2255', HIGH: '#ff6600', MEDIUM: '#ffaa00', LOW: '#00ccff'
}[s] || '#8899aa');

const AdminThreats = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadThreats(); const t = setInterval(loadThreats, 8000); return () => clearInterval(t); }, []);

  const loadThreats = async () => {
    try {
      const res = await adminApi.getThreats();
      setThreats(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  return (
    <div style={styles.layout}>
      <Sidebar role="ADMIN" />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <AlertTriangle size={22} color="#ff8800" />
            Threat Intelligence
          </h1>
          <p style={styles.sub}>AI/ML detected security threats and anomalies</p>
        </div>

        <div style={styles.grid}>
          {threats.length === 0 && !loading && (
            <div style={styles.empty}>No threats detected recently</div>
          )}
          {threats.map(t => (
            <div key={t.id} style={{ ...styles.threatCard, borderColor: `${severityColor(t.severity)}40` }}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.severityTag, background: `${severityColor(t.severity)}15`, color: severityColor(t.severity) }}>
                  <Zap size={11} />
                  {t.severity}
                </div>
                <div style={styles.scoreCircle}>
                  <span style={{ color: severityColor(t.severity) }}>{Math.round(t.anomalyScore * 100)}%</span>
                </div>
              </div>

              <div style={styles.threatType}>{t.threatType?.replace(/_/g, ' ')}</div>
              <div style={styles.threatDesc}>{t.description}</div>

              <div style={styles.meta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>User</span>
                  <span style={styles.metaVal}>@{t.username}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>IP</span>
                  <span style={styles.metaVal}>{t.ipAddress}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Action</span>
                  <span style={{ ...styles.metaVal, color: t.actionTaken ? '#22cc77' : '#ff4444' }}>
                    {t.actionTaken ? 'User Blocked' : 'Monitored'}
                  </span>
                </div>
              </div>

              <div style={styles.time}>
                <Clock size={11} color="#556677" />
                {new Date(t.detectedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#050a14', fontFamily: "'JetBrains Mono', monospace" },
  main: { flex: 1, padding: '28px', overflow: 'auto' },
  header: { marginBottom: '28px' },
  title: { display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
  sub: { color: '#8899aa', fontSize: '12px', margin: '4px 0 0 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  empty: { color: '#22cc77', fontSize: '14px', textAlign: 'center', padding: '60px', gridColumn: '1/-1', background: '#0a1628', borderRadius: '12px', border: '1px solid rgba(34,204,119,0.2)' },
  threatCard: { background: '#0a1628', border: '1px solid', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  severityTag: { display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' },
  scoreCircle: { fontSize: '18px', fontWeight: '700' },
  threatType: { color: '#eee', fontSize: '14px', fontWeight: '600' },
  threatDesc: { color: '#8899aa', fontSize: '12px', lineHeight: 1.5 },
  meta: { display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px' },
  metaItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { color: '#556677', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  metaVal: { color: '#ccc', fontSize: '12px' },
  time: { display: 'flex', alignItems: 'center', gap: '5px', color: '#556677', fontSize: '11px' },
};

export default AdminThreats;