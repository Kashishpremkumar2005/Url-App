import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function AnalyticsView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/analytics/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Error gathering metrics stream logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id, token]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading real-time audit data streams...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="alert alert-danger" style={{ justifyContent: 'center' }}>
            <span>Failed to acquire link logs.</span>
          </div>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '950px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Device & User Session Metrics</h2>
        
        <div style={{ margin: '20px 0', display: 'flex', gap: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '8px', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '16px' }}>
            <strong>Total Redirects Checked:</strong> <br />
            <span style={{ fontSize: '26px', color: 'var(--success)', fontWeight: 'bold' }}>{data.totalClicks}</span>
          </p>
          <p style={{ margin: 0, fontSize: '16px' }}>
            <strong>Last Active Access:</strong> <br />
            <span style={{ color: 'var(--info)', display: 'inline-block', marginTop: '5px' }}>
              {data.lastVisited ? new Date(data.lastVisited).toLocaleString() : 'No activity logged yet.'}
            </span>
          </p>
        </div>

        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>User Context Activity Logs</h3>
        <div className="table-responsive">
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px' }}>Timestamp</th>
                <th style={{ padding: '12px' }}>Logged-In User (Email)</th>
                <th style={{ padding: '12px' }}>Target Browser</th>
                <th style={{ padding: '12px' }}>Operating System</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((activity, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--primary)', fontWeight: '500' }}>
                    {activity.userEmail}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span className="badge badge-primary" style={{ textTransform: 'none', padding: '0.3rem 0.6rem' }}>
                      {activity.browser}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {activity.os}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.history.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '30px 0' }}>
              No tracked link access streams recorded yet in the database module.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;
