import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [role, setRole] = useState("USER");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await login(form.username, form.password, role);
      navigate(data.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authApi.register({ username: form.username, email: form.email, password: form.password, role: "USER" });
      setSuccess("Account created! You can now login.");
      setMode("login");
      setForm({ username: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  const styles = {
    page: { minHeight: "100vh", background: "#050a14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", position: "relative", overflow: "hidden" },
    grid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" },
    card: { background: "rgba(10,22,40,0.95)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(0,212,255,0.1)", position: "relative", zIndex: 1 },
    logo: { textAlign: "center", marginBottom: "28px" },
    shield: { fontSize: "40px", display: "block", marginBottom: "8px" },
    title: { color: "#00d4ff", fontSize: "20px", fontWeight: 700, margin: 0 },
    subtitle: { color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" },
    tabs: { display: "flex", marginBottom: "24px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "4px" },
    tab: (active) => ({ flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", transition: "all 0.2s", background: active ? "rgba(0,212,255,0.2)" : "transparent", color: active ? "#00d4ff" : "rgba(255,255,255,0.4)" }),
    roleTabs: { display: "flex", gap: "8px", marginBottom: "20px" },
    roleTab: (active) => ({ flex: 1, padding: "8px", border: `1px solid ${active ? "#00d4ff" : "rgba(255,255,255,0.1)"}`, borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", background: active ? "rgba(0,212,255,0.1)" : "transparent", color: active ? "#00d4ff" : "rgba(255,255,255,0.4)" }),
    label: { color: "rgba(255,255,255,0.6)", fontSize: "11px", marginBottom: "6px", display: "block" },
    input: { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "JetBrains Mono, monospace", marginBottom: "14px", boxSizing: "border-box", outline: "none" },
    btn: { width: "100%", padding: "12px", background: "linear-gradient(135deg, #00d4ff, #0066ff)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", cursor: "pointer", marginTop: "4px" },
    error: { background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "8px", padding: "10px 12px", color: "#ff4444", fontSize: "12px", marginBottom: "14px" },
    success: { background: "rgba(34,204,119,0.1)", border: "1px solid rgba(34,204,119,0.3)", borderRadius: "8px", padding: "10px 12px", color: "#22cc77", fontSize: "12px", marginBottom: "14px" },
    roleNote: { color: "rgba(255,255,255,0.3)", fontSize: "10px", textAlign: "center", marginTop: "14px" }
  };

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.shield}>🛡️</span>
          <div style={styles.title}>ZERO TRUST</div>
          <div style={styles.subtitle}>AI-Powered API Security Platform</div>
        </div>

        {/* Login / Register Tabs - Register only for USER */}
        <div style={styles.tabs}>
          <button style={styles.tab(mode === "login")} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
            🔐 Login
          </button>
          <button style={styles.tab(mode === "register")} onClick={() => { setMode("register"); setError(""); setSuccess(""); setRole("USER"); }}>
            ✏️ Register
          </button>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}
        {success && <div style={styles.success}>✅ {success}</div>}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <div style={styles.roleTabs}>
              <button type="button" style={styles.roleTab(role === "USER")} onClick={() => setRole("USER")}>👤 User</button>
              <button type="button" style={styles.roleTab(role === "ADMIN")} onClick={() => setRole("ADMIN")}>⚙️ Admin</button>
            </div>
            <label style={styles.label}>USERNAME</label>
            <input style={styles.input} name="username" placeholder="Enter username" value={form.username} onChange={handleChange} required />
            <label style={styles.label}>PASSWORD</label>
            <input style={styles.input} name="password" type="password" placeholder="Enter password" value={form.password} onChange={handleChange} required />
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Authenticating..." : `Login as ${role}`}
            </button>
            <div style={styles.roleNote}>
              {role === "ADMIN" ? "Admin: admin / Admin@123" : "User: testuser / User@123"}
            </div>
          </form>
        )}

        {/* REGISTER FORM - Users only */}
        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <div style={{ ...styles.roleNote, marginBottom: "16px", marginTop: 0, color: "rgba(0,212,255,0.6)", fontSize: "11px" }}>
              🔒 Registration is for User accounts only
            </div>
            <label style={styles.label}>USERNAME</label>
            <input style={styles.input} name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} required />
            <label style={styles.label}>EMAIL</label>
            <input style={styles.input} name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
            <label style={styles.label}>PASSWORD</label>
            <input style={styles.input} name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
            <label style={styles.label}>CONFIRM PASSWORD</label>
            <input style={styles.input} name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <div style={styles.roleNote}>
              Already have an account?{" "}
              <span style={{ color: "#00d4ff", cursor: "pointer" }} onClick={() => setMode("login")}>Login here</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}