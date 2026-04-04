import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import Sidebar from '../shared/Sidebar';
import { Users, Ban, CheckCircle, XCircle, Shield, Search } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await adminApi.getAllUsers();
      setUsers(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleBlock = async (username) => {
    const reason = prompt(`Reason for blocking ${username}:`) || 'Manually blocked by admin';
    await adminApi.blockUser(username, reason);
    loadUsers();
  };

  const handleUnblock = async (username) => {
    await adminApi.unblockUser(username);
    loadUsers();
  };

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={styles.layout}>
      <Sidebar role="ADMIN" />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.sub}>Manage and monitor all platform users</p>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrap}>
            <Search size={15} color="#556677" style={styles.searchIcon} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterBtns}>
            {['ALL', 'ACTIVE', 'BLOCKED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.table}>
          <div style={styles.tableHead}>
            <div style={styles.th}>User</div>
            <div style={styles.th}>Role</div>
            <div style={styles.th}>Status</div>
            <div style={styles.th}>Risk Score</div>
            <div style={styles.th}>Last Login</div>
            <div style={styles.th}>Actions</div>
          </div>
          {filtered.map(u => (
            <div key={u.id} style={styles.tableRow}>
              <div>
                <div style={styles.uName}>{u.username}</div>
                <div style={styles.uEmail}>{u.email}</div>
              </div>
              <div style={{ ...styles.roleBadge, color: u.role === 'ADMIN' ? '#aa88ff' : '#00d4ff' }}>
                {u.role === 'ADMIN' ? <Shield size={12} /> : <Users size={12} />}
                {u.role}
              </div>
              <div style={{
                ...styles.statusBadge,
                background: u.status === 'ACTIVE' ? '#22cc7720' : '#ff444420',
                color: u.status === 'ACTIVE' ? '#22cc77' : '#ff4444'
              }}>
                {u.status === 'ACTIVE' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                {u.status}
              </div>
              <div style={{ color: getRiskColor(u.riskScore), fontSize: '13px', fontWeight: '600' }}>
                {((u.riskScore || 0) * 100).toFixed(0)}%
              </div>
              <div style={styles.date}>
                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
              </div>
              <div>
                {u.role !== 'ADMIN' && (
                  u.status === 'BLOCKED' ? (
                    <button onClick={() => handleUnblock(u.username)} style={styles.unblockBtn}>
                      <CheckCircle size={12} /> Unblock
                    </button>
                  ) : (
                    <button onClick={() => handleBlock(u.username)} style={styles.blockBtn}>
                      <Ban size={12} /> Block
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const getRiskColor = (score) => {
  if (!score || score < 0.3) return '#22cc77';
  if (score < 0.6) return '#ffaa00';
  return '#ff4444';
};

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#050a14', fontFamily: "'JetBrains Mono', monospace" },
  main: { flex: 1, padding: '28px', overflow: 'auto' },
  header: { marginBottom: '24px' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
  sub: { color: '#8899aa', fontSize: '12px', margin: '4px 0 0 0' },
  controls: { display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' },
  searchWrap: { position: 'relative', flex: 1, maxWidth: '320px' },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  searchInput: { width: '100%', background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 10px 10px 36px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  filterBtns: { display: 'flex', gap: '6px' },
  filterBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 14px', color: '#8899aa', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.08em' },
  filterBtnActive: { background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', color: '#00d4ff' },
  table: { background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  th: { color: '#556677', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' },
  uName: { color: '#ddd', fontSize: '13px' },
  uEmail: { color: '#556677', fontSize: '11px' },
  roleBadge: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' },
  date: { color: '#8899aa', fontSize: '11px' },
  blockBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '6px', padding: '5px 12px', color: '#ff6666', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer' },
  unblockBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(34,204,119,0.1)', border: '1px solid rgba(34,204,119,0.2)', borderRadius: '6px', padding: '5px 12px', color: '#22cc77', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer' },
};

export default AdminUsers;