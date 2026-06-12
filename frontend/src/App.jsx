import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AnalyticsView from './components/AnalyticsView';

// Protected Route Guard validation check
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Navbar Layout header
const Navbar = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem('userEmail') || 'user@example.com';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="flex-between" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Link to="/dashboard" className="logo" style={{ color: '#fff' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>Trimly</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Account</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{email}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const hasToken = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation router toggle */}
        <Routes>
          <Route path="/auth" element={null} />
          <Route path="*" element={<Navbar />} />
        </Routes>

        <div style={{ flex: 1 }}>
          <Routes>
            {/* Auth Login/Register Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard workspace */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Analytics View endpoint */}
            <Route
              path="/analytics/:id"
              element={
                <ProtectedRoute>
                  <AnalyticsView />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route
              path="*"
              element={
                hasToken ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
              }
            />
          </Routes>
        </div>

        {/* Footer Area */}
        <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
          <div>Trimly URL Analytics. Designed for high fidelity latency & visual speed.</div>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default App;
