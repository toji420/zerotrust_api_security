import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const adminLinks = [
    { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/admin/users",     icon: "👥", label: "Users" },
    { path: "/admin/threats",   icon: "🚨", label: "Threats" },
    { path: "/admin/api-logs",  icon: "📋", label: "API Logs" },
  ];

  const userLinks = [
    { path: "/user/dashboard", icon: "📊", label: "Dashboard" },
  ];

  const links = user?.role === "ADMIN" ? adminLinks : userLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const styles = {
    sidebar: { width: collapsed ? "64px" : "220px", minHeight: "100vh", background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(0,212,255,0.1)", display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden" },
    top: { padding: "20px 16px", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    brand: { color: "#00d4ff", fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden" },
    collapseBtn: { background: "none", border: "none", color: "rgba(0,212,255,0.6)", cursor: "pointer", fontSize: "16px", flexShrink: 0 },
    nav: { flex: 1, padding: "16px 8px" },
    link: (active) => ({ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", marginBottom: "4px", background: active ? "rgba(0,212,255,0.15)" : "transparent", border: active ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent", color: active ? "#00d4ff" : "rgba(255,255,255,0.5)", fontSize: "13px", fontFamily: "JetBrains Mono, monospace", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden" }),
    icon: { fontSize: "16px", flexShrink: 0 },
    bottom: { padding: "16px 8px", borderTop: "1px solid rgba(0,212,255,0.1)" },
    userInfo: { padding: "10px 12px", marginBottom: "8px", overflow: "hidden" },
    userName: { color: "#00d4ff", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    userRole: { color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "2px" },
    logoutBtn: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff4444", fontSize: "13px", fontFamily: "JetBrains Mono, monospace", width: "100%", whiteSpace: "nowrap", overflow: "hidden" },
    dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#22cc77", flexShrink: 0 },
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.top}>
        {!collapsed && <div style={styles.brand}>🛡️ ZeroTrust</div>}
        <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav style={styles.nav}>
        {links.map(link => (
          <div key={link.path}
            style={styles.link(location.pathname === link.path)}
            onClick={() => navigate(link.path)}
          >
            <span style={styles.icon}>{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </div>
        ))}
      </nav>

      <div style={styles.bottom}>
        {!collapsed && (
          <div style={styles.userInfo}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={styles.dot} />
              <div>
                <div style={styles.userName}>{user?.username}</div>
                <div style={styles.userRole}>{user?.role}</div>
              </div>
            </div>
          </div>
        )}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <span style={styles.icon}>🚪</span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}