import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../shared/Sidebar";
import { adminApi } from "../../services/api";

export default function AdminApiLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [userFilter, setUserFilter]     = useState("ALL"); // "ALL" | specific username
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [threatFilter, setThreatFilter] = useState("ALL");
  const [endpointSearch, setEndpointSearch] = useState("");

  // Dropdown state
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [showUserList, setShowUserList]   = useState(false); // sub-list under "Users"
  const [showAdminList, setShowAdminList] = useState(false); // sub-list under "Admins"
  const dropdownRef = useRef(null);

  // Derived lists
  const [userList, setUserList]   = useState([]);
  const [adminList, setAdminList] = useState([]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowUserList(false);
        setShowAdminList(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchLogs = async () => {
    try {
      setError(null);
      const res = await adminApi.getRecentLogs();
      const data = res.data || [];
      setLogs(data);

      const map = {};
      data.forEach((l) => { if (l.username) map[l.username] = l.userRole || "USER"; });
      setUserList(Object.keys(map).filter((u) => map[u] !== "ADMIN").sort());
      setAdminList(Object.keys(map).filter((u) => map[u] === "ADMIN").sort());
    } catch (err) {
      const st = err.response?.status;
      setError(
        st === 403 ? "Access denied. Admin role required." :
        st === 404 ? "Endpoint not found. Check AdminController.java." :
        `Failed to load logs (${st || "network error"}).`
      );
      setLogs([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); const t = setInterval(fetchLogs, 10000); return () => clearInterval(t); }, []);

  // Apply filters
  useEffect(() => {
    let data = [...logs];
    if (userFilter !== "ALL") data = data.filter((l) => l.username === userFilter);
    if (endpointSearch) data = data.filter((l) =>
      (l.endpoint || "").toLowerCase().includes(endpointSearch.toLowerCase()) ||
      (l.ipAddress || "").toLowerCase().includes(endpointSearch.toLowerCase())
    );
    if (methodFilter !== "ALL") data = data.filter((l) => l.method === methodFilter);
    if (statusFilter === "2xx") data = data.filter((l) => l.statusCode >= 200 && l.statusCode < 300);
    if (statusFilter === "4xx") data = data.filter((l) => l.statusCode >= 400 && l.statusCode < 500);
    if (statusFilter === "5xx") data = data.filter((l) => l.statusCode >= 500);
    if (threatFilter === "THREAT") data = data.filter((l) => l.threatDetected);
    if (threatFilter === "CLEAN")  data = data.filter((l) => !l.threatDetected);
    setFiltered(data);
  }, [userFilter, endpointSearch, methodFilter, statusFilter, threatFilter, logs]);

  const totalRequests = logs.length;
  const threatCount   = logs.filter((l) => l.threatDetected).length;
  const errorCount    = logs.filter((l) => l.statusCode >= 400).length;
  const avgResponse   = logs.length > 0
    ? Math.round(logs.reduce((a, b) => a + (b.responseTimeMs || 0), 0) / logs.length) : 0;

  const formatTime = (ts) => ts
    ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "-";
  const truncate = (str, n) => str && str.length > n ? str.substring(0, n) + "..." : str;

  const triggerLabel = userFilter !== "ALL" ? `@${userFilter}` : "All";

  const selectUser = (username) => {
    setUserFilter(username);
    setDropdownOpen(false);
    setShowUserList(false);
    setShowAdminList(false);
  };

  const clearFilter = () => setUserFilter("ALL");

  const s = {
    page:    { display: "flex", minHeight: "100vh", background: "#050a14", fontFamily: "JetBrains Mono, monospace" },
    main:    { flex: 1, padding: "24px", overflowY: "auto" },
    header:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    title:   { color: "#00d4ff", fontSize: "20px", fontWeight: 700 },
    subtitle:{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "4px" },
    liveRow: { display: "flex", alignItems: "center", gap: "16px" },
    liveInd: { display: "flex", alignItems: "center", gap: "6px", color: "rgba(34,204,119,0.8)", fontSize: "11px" },
    liveDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#22cc77" },
    refreshBtn: { background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "8px", color: "#00d4ff", padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontFamily: "JetBrains Mono, monospace" },

    statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" },
    statCard: (c) => ({ background: "rgba(10,22,40,0.8)", border: `1px solid ${c}30`, borderRadius: "12px", padding: "16px", textAlign: "center" }),
    statNum:  (c) => ({ color: c, fontSize: "28px", fontWeight: 700 }),
    statLabel:{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "4px" },

    filtersRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "flex-end" },
    filterGroup:{ display: "flex", flexDirection: "column", gap: "4px" },
    filterLabel:{ color: "rgba(0,212,255,0.6)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" },

    // Trigger button
    trigger: (open) => ({
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
      padding: "10px 14px", minWidth: "150px",
      background: open ? "rgba(0,212,255,0.1)" : "rgba(10,22,40,0.9)",
      border: `1px solid ${open ? "rgba(0,212,255,0.5)" : "rgba(0,212,255,0.25)"}`,
      borderRadius: "8px", color: "#fff", fontSize: "12px",
      fontFamily: "JetBrains Mono, monospace", cursor: "pointer", userSelect: "none",
    }),

    // Panel
    panel: {
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
      background: "#0a1628", border: "1px solid rgba(0,212,255,0.2)",
      borderRadius: "10px", minWidth: "190px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)", overflow: "hidden",
    },

    // "Users" / "Admins" top-level rows
    roleRow: (active) => ({
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", cursor: "pointer",
      background: active ? "rgba(0,212,255,0.08)" : "transparent",
      color: active ? "#00d4ff" : "rgba(255,255,255,0.8)",
      fontSize: "12px", fontWeight: 600,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      transition: "background 0.15s",
    }),

    // Sub-list
    subList: { background: "rgba(0,0,0,0.25)", maxHeight: "160px", overflowY: "auto" },
    subItem: (active) => ({
      padding: "8px 16px 8px 30px", cursor: "pointer",
      color: active ? "#00d4ff" : "rgba(255,255,255,0.55)",
      fontSize: "11px",
      background: active ? "rgba(0,212,255,0.07)" : "transparent",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
      transition: "background 0.15s",
    }),

    select: {
      padding: "10px 14px", background: "rgba(10,22,40,0.9)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
      color: "#fff", fontSize: "12px", fontFamily: "JetBrains Mono, monospace",
      outline: "none", cursor: "pointer",
      appearance: "none", WebkitAppearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "32px",
    },
    searchInput: {
      flex: 1, minWidth: "180px", padding: "10px 14px",
      background: "rgba(10,22,40,0.9)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px", color: "#fff", fontSize: "12px",
      fontFamily: "JetBrains Mono, monospace", outline: "none",
    },

    activeBadge: {
      display: "flex", alignItems: "center", gap: "8px",
      padding: "6px 14px", background: "rgba(0,212,255,0.06)",
      border: "1px solid rgba(0,212,255,0.15)", borderRadius: "8px", marginBottom: "16px",
    },
    adminChip: { background: "rgba(170,136,255,0.2)", border: "1px solid rgba(170,136,255,0.35)", borderRadius: "4px", padding: "2px 8px", color: "#aa88ff", fontSize: "10px", fontWeight: 700 },
    userChip:  { background: "rgba(0,212,255,0.15)",  border: "1px solid rgba(0,212,255,0.3)",    borderRadius: "4px", padding: "2px 8px", color: "#00d4ff",  fontSize: "10px", fontWeight: 700 },
    clearBtn:  { marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "15px", fontFamily: "JetBrains Mono, monospace" },

    tableWrap: { background: "rgba(10,22,40,0.8)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: "12px", overflow: "hidden" },
    table:  { width: "100%", borderCollapse: "collapse" },
    thead:  { background: "rgba(0,212,255,0.05)", borderBottom: "1px solid rgba(0,212,255,0.1)" },
    th:     { padding: "12px 16px", textAlign: "left", color: "rgba(0,212,255,0.8)", fontSize: "11px", fontWeight: 600, letterSpacing: "1px" },
    tr:     (threat) => ({ borderBottom: "1px solid rgba(255,255,255,0.05)", background: threat ? "rgba(255,68,68,0.03)" : "transparent", transition: "background 0.2s" }),
    td:     { padding: "12px 16px", color: "rgba(255,255,255,0.8)", fontSize: "12px" },
    methodBadge: (m) => { const c = { GET:"#22cc77", POST:"#00d4ff", PUT:"#f59e0b", DELETE:"#ff4444", PATCH:"#a78bfa" }[m]||"#888"; return { background:`${c}20`, border:`1px solid ${c}40`, borderRadius:"4px", padding:"2px 8px", color:c, fontSize:"10px", fontWeight:700 }; },
    statusBadge: (sc) => { const c = sc>=500?"#ff4444":sc>=400?"#f59e0b":"#22cc77"; return { background:`${c}20`, border:`1px solid ${c}40`, borderRadius:"4px", padding:"2px 8px", color:c, fontSize:"11px", fontWeight:700 }; },
    threatBadge: { background:"rgba(255,68,68,0.15)", border:"1px solid rgba(255,68,68,0.4)", borderRadius:"4px", padding:"2px 8px", color:"#ff4444", fontSize:"10px", fontWeight:700 },
    cleanBadge:  { background:"rgba(34,204,119,0.15)", border:"1px solid rgba(34,204,119,0.4)", borderRadius:"4px", padding:"2px 8px", color:"#22cc77", fontSize:"10px" },
    threatTypeBadge: { background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:"4px", padding:"2px 6px", color:"#ff6666", fontSize:"10px" },
    empty:   { textAlign:"center", padding:"60px", color:"rgba(255,255,255,0.3)", fontSize:"14px" },
    errorBox:{ textAlign:"center", padding:"30px", color:"#ff6666", fontSize:"13px", background:"rgba(255,68,68,0.05)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:"8px", marginBottom:"20px" },
    footer:  { marginTop:"12px", color:"rgba(255,255,255,0.3)", fontSize:"11px", textAlign:"right" },
  };

  return (
    <div style={s.page}>
      <Sidebar role="ADMIN" />
      <div style={s.main}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.title}>📋 API Logs</div>
            <div style={s.subtitle}>Real-time request monitoring — last 1 hour</div>
          </div>
          <div style={s.liveRow}>
            <div style={s.liveInd}><div style={s.liveDot} />Live — refreshes every 10s</div>
            <button style={s.refreshBtn} onClick={fetchLogs}>↻ Refresh</button>
          </div>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statCard("#00d4ff")}><div style={s.statNum("#00d4ff")}>{totalRequests}</div><div style={s.statLabel}>Total Requests</div></div>
          <div style={s.statCard("#ff4444")}><div style={s.statNum("#ff4444")}>{threatCount}</div><div style={s.statLabel}>Threats Detected</div></div>
          <div style={s.statCard("#f59e0b")}><div style={s.statNum("#f59e0b")}>{errorCount}</div><div style={s.statLabel}>Error Responses</div></div>
          <div style={s.statCard("#22cc77")}><div style={s.statNum("#22cc77")}>{avgResponse}ms</div><div style={s.statLabel}>Avg Response Time</div></div>
        </div>

        {/* Filters */}
        <div style={s.filtersRow}>

          {/* ── USER DROPDOWN ── */}
          <div style={{ ...s.filterGroup, position: "relative" }} ref={dropdownRef}>
            <div style={s.filterLabel}>USER</div>
            <div style={s.trigger(dropdownOpen)} onClick={() => setDropdownOpen((o) => !o)}>
              <span>{triggerLabel}</span>
              <span style={{ color: "#00d4ff", fontSize: "10px", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
            </div>

            {dropdownOpen && (
              <div style={s.panel}>

                {/* ── Users row ── */}
                <div>
                  <div
                    style={s.roleRow(showUserList)}
                    onClick={() => { setShowUserList((v) => !v); setShowAdminList(false); }}
                    onMouseEnter={(e) => { if (!showUserList) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!showUserList) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>👤 Users <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({userList.length})</span></span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{showUserList ? "▲" : "▶"}</span>
                  </div>

                  {showUserList && (
                    <div style={s.subList}>
                      {userList.length === 0
                        ? <div style={{ ...s.subItem(false), cursor: "default", color: "rgba(255,255,255,0.25)" }}>No users in logs</div>
                        : userList.map((u) => (
                          <div
                            key={u}
                            style={s.subItem(userFilter === u)}
                            onClick={() => selectUser(u)}
                            onMouseEnter={(e) => { if (userFilter !== u) e.currentTarget.style.background = "rgba(0,212,255,0.07)"; }}
                            onMouseLeave={(e) => { if (userFilter !== u) e.currentTarget.style.background = "transparent"; }}
                          >
                            @{u}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* ── Admins row ── */}
                <div>
                  <div
                    style={{ ...s.roleRow(showAdminList), borderBottom: "none" }}
                    onClick={() => { setShowAdminList((v) => !v); setShowUserList(false); }}
                    onMouseEnter={(e) => { if (!showAdminList) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!showAdminList) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>🛡️ Admins <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({adminList.length})</span></span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{showAdminList ? "▲" : "▶"}</span>
                  </div>

                  {showAdminList && (
                    <div style={s.subList}>
                      {adminList.length === 0
                        ? <div style={{ ...s.subItem(false), cursor: "default", color: "rgba(255,255,255,0.25)" }}>No admins in logs</div>
                        : adminList.map((u) => (
                          <div
                            key={u}
                            style={s.subItem(userFilter === u)}
                            onClick={() => selectUser(u)}
                            onMouseEnter={(e) => { if (userFilter !== u) e.currentTarget.style.background = "rgba(170,136,255,0.08)"; }}
                            onMouseLeave={(e) => { if (userFilter !== u) e.currentTarget.style.background = "transparent"; }}
                          >
                            @{u}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* METHOD */}
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>METHOD</div>
            <select style={s.select} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* STATUS */}
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>STATUS</div>
            <select style={s.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
          </div>

          {/* THREAT */}
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>THREAT</div>
            <select style={s.select} value={threatFilter} onChange={(e) => setThreatFilter(e.target.value)}>
              <option value="ALL">All Requests</option>
              <option value="THREAT">⚠ Threats Only</option>
              <option value="CLEAN">✓ Clean Only</option>
            </select>
          </div>

          {/* ENDPOINT */}
          <div style={{ ...s.filterGroup, flex: 1 }}>
            <div style={s.filterLabel}>ENDPOINT / IP</div>
            <input
              style={s.searchInput}
              placeholder="🔍 Search endpoint or IP..."
              value={endpointSearch}
              onChange={(e) => setEndpointSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Active filter badge */}
        {userFilter !== "ALL" && (
          <div style={s.activeBadge}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>Filtering by:</span>
            <span style={{ color: "#00d4ff", fontSize: "13px", fontWeight: 600 }}>@{userFilter}</span>
            {adminList.includes(userFilter)
              ? <span style={s.adminChip}>ADMIN</span>
              : <span style={s.userChip}>USER</span>
            }
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
              — {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
            <button style={s.clearBtn} onClick={clearFilter} title="Clear filter">✕</button>
          </div>
        )}

        {/* Table */}
        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.empty}>Loading logs...</div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>No logs found for the selected filters.</div>
          ) : (
            <table style={s.table}>
              <thead style={s.thead}>
                <tr>
                  <th style={s.th}>TIME</th>
                  <th style={s.th}>USER</th>
                  <th style={s.th}>METHOD</th>
                  <th style={s.th}>ENDPOINT</th>
                  <th style={s.th}>STATUS</th>
                  <th style={s.th}>RESPONSE TIME</th>
                  <th style={s.th}>IP ADDRESS</th>
                  <th style={s.th}>THREAT</th>
                  <th style={s.th}>THREAT TYPE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id || i}
                    style={s.tr(log.threatDetected)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = log.threatDetected ? "rgba(255,68,68,0.08)" : "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = log.threatDetected ? "rgba(255,68,68,0.03)" : "transparent")}
                  >
                    <td style={{ ...s.td, color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{formatTime(log.timestamp)}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{ color: "#00d4ff", cursor: "pointer" }}
                          onClick={() => selectUser(log.username)}
                          title={`Filter by ${log.username}`}
                        >
                          {log.username || "anonymous"}
                        </span>
                        {log.userRole === "ADMIN" && (
                          <span style={{ ...s.adminChip, fontSize: "9px", padding: "1px 5px" }}>ADMIN</span>
                        )}
                      </div>
                    </td>
                    <td style={s.td}><span style={s.methodBadge(log.method)}>{log.method}</span></td>
                    <td style={{ ...s.td, maxWidth: "200px" }}><span title={log.endpoint}>{truncate(log.endpoint, 35)}</span></td>
                    <td style={s.td}><span style={s.statusBadge(log.statusCode)}>{log.statusCode}</span></td>
                    <td style={s.td}>
                      <span style={{ color: log.responseTimeMs > 2000 ? "#f59e0b" : "rgba(255,255,255,0.6)" }}>
                        {log.responseTimeMs ? `${log.responseTimeMs}ms` : "-"}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{log.ipAddress || "-"}</td>
                    <td style={s.td}>
                      {log.threatDetected
                        ? <span style={s.threatBadge}>⚠ THREAT</span>
                        : <span style={s.cleanBadge}>✓ CLEAN</span>
                      }
                    </td>
                    <td style={s.td}>
                      {log.threatType
                        ? <span style={s.threatTypeBadge}>{log.threatType}</span>
                        : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          Showing {filtered.length} of {logs.length} requests
          {userFilter !== "ALL" && ` · filtered by @${userFilter}`}
        </div>

      </div>
    </div>
  );
}