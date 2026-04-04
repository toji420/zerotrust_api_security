import React from 'react';
import { ShieldOff, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BlockedPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.iconWrap}>
          <ShieldOff size={60} color="#ff4444" />
        </div>
        <h1 style={styles.title}>Account Blocked</h1>
        <div style={styles.alert}>
          <AlertTriangle size={18} color="#ff9900" />
          <p style={styles.alertText}>
            Your account has been automatically blocked due to suspicious activity detected
            by our AI threat detection system.
          </p>
        </div>
        <p style={styles.desc}>
          Our Zero Trust security system detected anomalous behavior patterns in your
          API usage. Your access tokens have been revoked and your account suspended.
        </p>
        <p style={styles.contact}>
          Contact your administrator to restore access.
        </p>
        <button onClick={() => navigate('/login')} style={styles.btn}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#050a14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
  },
  container: {
    background: 'rgba(20, 5, 5, 0.95)',
    border: '1px solid rgba(255, 68, 68, 0.4)',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '440px',
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(255, 68, 68, 0.1)',
  },
  iconWrap: { marginBottom: '24px' },
  title: {
    color: '#ff4444',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 24px 0',
  },
  alert: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(255, 153, 0, 0.1)',
    border: '1px solid rgba(255, 153, 0, 0.3)',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  alertText: { color: '#ffaa33', fontSize: '13px', margin: 0 },
  desc: { color: '#8899aa', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' },
  contact: { color: '#ff6666', fontSize: '13px', marginBottom: '28px' },
  btn: {
    background: 'rgba(255, 68, 68, 0.15)',
    border: '1px solid rgba(255, 68, 68, 0.4)',
    borderRadius: '8px',
    padding: '12px 32px',
    color: '#ff6666',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};

export default BlockedPage;