import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [shortenLoading, setShortenLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [copiedId, setCopiedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/url/myurls', getAuthConfig());
      setLinks(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 401) {
        localStorage.clear();
        navigate('/auth');
      } else {
        setErrorBanner('Failed to fetch link records.');
      }
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setSuccessBanner('');
    setValidationErrors({});

    const errors = {};
    const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;

    if (!originalUrl) {
      errors.url = 'Original destination URL is required.';
    } else if (!urlPattern.test(originalUrl)) {
      errors.url = 'Please enter a valid HTTP/HTTPS URL.';
    }

    if (customCode && customCode.length < 3) {
      errors.code = 'Custom shortcode must be at least 3 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setShortenLoading(true);

    try {
      const formattedUrl = originalUrl.startsWith('http') ? originalUrl : `http://${originalUrl}`;
      const payload = { longUrl: formattedUrl };
      if (customCode) payload.customCode = customCode;

      const response = await axios.post('http://localhost:5000/api/url/shorten', payload, getAuthConfig());
      setShortenLoading(false);
      setSuccessBanner('Short URL created successfully!');
      setOriginalUrl('');
      setCustomCode('');
      setLinks([response.data, ...links]);
    } catch (err) {
      setShortenLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorBanner(err.response.data.error);
      } else {
        setErrorBanner('Failed to shorten URL. Check network connection.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this link?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/url/${id}`, getAuthConfig());
      setLinks(links.filter(link => link._id !== id));
      setSuccessBanner('URL deleted successfully!');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setErrorBanner(err.response.data.error);
      } else {
        setErrorBanner('Failed to delete URL.');
      }
    }
  };

  const copyToClipboard = (code, id) => {
    const url = `http://localhost:5000/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const truncateText = (text, max = 45) => {
    return text.length > max ? `${text.substring(0, max)}...` : text;
  };

  const filteredLinks = links.filter(l => 
    (l.longUrl || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.shortCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClicks = links.reduce((sum, item) => sum + item.clicks, 0);

  return (
    <div className="app-container">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Links</span>
          <span className="stat-val gradient-text">{links.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Click Events</span>
          <span className="stat-val" style={{ color: 'var(--success)' }}>{totalClicks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Clicks</span>
          <span className="stat-val" style={{ color: 'var(--info)' }}>
            {links.length > 0 ? Math.round(totalClicks / links.length) : 0}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Shorten New Link</h3>
          
          {successBanner && (
            <div className="alert alert-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>{successBanner}</div>
            </div>
          )}

          {errorBanner && (
            <div className="alert alert-danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>{errorBanner}</div>
            </div>
          )}

          <form onSubmit={handleShorten} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Destination URL</label>
                <input
                  type="text"
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value);
                    if (validationErrors.url) setValidationErrors(p => ({ ...p, url: null }));
                  }}
                  className={`form-control ${validationErrors.url ? 'is-invalid' : originalUrl ? 'is-valid' : ''}`}
                  placeholder="Paste URL (e.g. https://react.dev)"
                  disabled={shortenLoading}
                />
                {validationErrors.url && <div className="error-feedback">{validationErrors.url}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Custom alias (optional)</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => {
                    setCustomCode(e.target.value);
                    if (validationErrors.code) setValidationErrors(p => ({ ...p, code: null }));
                  }}
                  className={`form-control ${validationErrors.code ? 'is-invalid' : customCode ? 'is-valid' : ''}`}
                  placeholder="e.g. reactdoc"
                  disabled={shortenLoading}
                />
                {validationErrors.code && <div className="error-feedback">{validationErrors.code}</div>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={shortenLoading}>
              {shortenLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Shortening...</span>
                </>
              ) : (
                <span>Shorten URL</span>
              )}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Your Shortened Links</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              placeholder="Search alias or link..."
              style={{ maxWidth: '280px', padding: '0.5rem 1rem' }}
            />
          </div>

          {loading ? (
            <div className="page-loader">
              <div className="page-spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving your shortened links...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No links found. Create your first link above!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Original Destination</th>
                    <th>Short Link</th>
                    <th>Created At</th>
                    <th>Clicks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => {
                    const shortUrl = `http://localhost:5000/${link.shortCode}`;
                    return (
                      <tr key={link._id}>
                        <td title={link.longUrl}>
                          <a href={link.longUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {truncateText(link.longUrl)}
                          </a>
                        </td>
                        <td>
                          <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            /{link.shortCode}
                          </a>
                        </td>
                        <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-primary">{link.clicks} clicks</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => copyToClipboard(link.shortCode, link._id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minWidth: '72px' }}>
                              {copiedId === link._id ? 'Copied' : 'Copy'}
                            </button>
                            <Link to={`/analytics/${link._id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none', background: 'rgba(99,102,241,0.05)' }}>
                              Analytics
                            </Link>
                            <button onClick={() => handleDelete(link._id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
