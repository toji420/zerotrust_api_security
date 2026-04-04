import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import BlockedPage from './components/auth/BlockedPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminThreats from './components/admin/AdminThreats';
import AdminApiLogs from './components/admin/AdminApiLogs';
import UserDashboard from './components/user/UserDashboard';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#00d4ff', padding: '40px', textAlign: 'center', fontFamily: 'monospace' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/blocked" element={<BlockedPage />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>
          } />
          <Route path="/admin/threats" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminThreats /></ProtectedRoute>
          } />

          <Route path="/admin/api-logs" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminApiLogs /></ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute requiredRole="USER"><UserDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;