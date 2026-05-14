import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './index.css';

const BACKEND = 'http://localhost:5000';
const socket  = io(BACKEND, { autoConnect: true });

// ── OWASP module metadata (mirrors backend engine) ─────────────────────────
const OWASP_MODULES = [
  { id: 'A01:2021', label: 'Broken Access Control',           sev: 'High',     desc: 'IDOR, path traversal, privilege escalation' },
  { id: 'A02:2021', label: 'Cryptographic Failures',          sev: 'Critical', desc: 'Plaintext secrets, weak hashing, no HTTPS' },
  { id: 'A03:2021', label: 'Injection (XSS / SQLi)',          sev: 'High',     desc: 'XSS, SQL injection, command injection' },
  { id: 'A04:2021', label: 'Insecure Design',                 sev: 'High',     desc: 'OTP brute force, business logic flaws' },
  { id: 'A05:2021', label: 'Security Misconfiguration',       sev: 'Critical', desc: 'Debug endpoints, exposed env vars' },
  { id: 'A06:2021', label: 'Vulnerable Components',           sev: 'Critical', desc: 'Log4Shell, outdated library CVEs' },
  { id: 'A07:2021', label: 'Auth Failures (SQLi Bypass)',     sev: 'Critical', desc: 'Authentication bypass, session issues' },
  { id: 'A08:2021', label: 'Software Integrity Failures',     sev: 'High',     desc: 'CSRF, unsigned updates, malicious CI/CD' },
  { id: 'A09:2021', label: 'Logging & Monitoring Failures',   sev: 'Medium',   desc: 'Brute force attacks going undetected' },
  { id: 'A10:2021', label: 'SSRF',                            sev: 'Critical', desc: 'Server-side request forgery, metadata theft' },
];

// Quick scan preset — highest-impact 4 modules
const QUICK_MODULES = ['A03:2021', 'A07:2021', 'A05:2021', 'A01:2021'];

// ── Helper: severity → css class ─────────────────────────────
const sevClass = (sev) => ({
  Critical: 'sev-critical',
  High:     'sev-high',
  Medium:   'sev-medium',
  Low:      'sev-low',
})[sev] || 'sev-medium';

// ── Helper: format timestamp ──────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Subcomponent: Stat Card ───────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

// ── Subcomponent: Vulnerability Card ─────────────────────────
function VulnCard({ finding, onPlay }) {
  const sc = sevClass(finding.severity);
  return (
    <div className={`vuln-card ${sc}`}>
      <div className="vuln-card-header">
        <div className="vuln-card-badges">
          <span className={`badge ${sc}`}>{finding.severity}</span>
          <span className="badge owasp">{finding.owaspId}</span>
          <span className="badge cwe">{finding.cwe}</span>
        </div>
      </div>
      <div className="vuln-card-title">{finding.vulnerability}</div>
      <div className="vuln-card-desc">{finding.description}</div>

      <div className="vuln-card-url">
        <span>🔗</span>
        <span title={finding.url}>{finding.url}</span>
      </div>

      <div className="remediation">
        <div className="remediation-label">✅ Remediation</div>
        <p>{finding.remediation}</p>
      </div>

      <div className="vuln-card-footer">
        {finding.evidence?.videoPath ? (
          <button className="btn-play" onClick={() => onPlay(finding)}>
            <span className="play-icon">▶</span> Play Visual Evidence
          </button>
        ) : (
          <button className="btn-play" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            <span className="play-icon">⏺</span> Recording pending...
          </button>
        )}
        <span className="vuln-time">{fmtTime(finding.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Subcomponent: Video Modal ─────────────────────────────────
function VideoModal({ finding, onClose }) {
  if (!finding) return null;
  const videoUrl = `${BACKEND}${finding.evidence.videoPath}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className={`badge ${sevClass(finding.severity)}`}>{finding.severity}</span>
            <div>
              <div className="modal-title">{finding.vulnerability}</div>
              <div className="modal-subtitle">{finding.owaspId} — Visual Exploit Evidence</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-video-wrap">
          <video
            className="modal-video"
            src={videoUrl}
            autoPlay
            controls
            key={videoUrl}
          />
        </div>

        <div className="modal-footer">
          <span className={`badge ${sevClass(finding.severity)}`}>{finding.severity}</span>
          <span className="badge owasp">{finding.owaspId}</span>
          <span className="badge cwe">{finding.cwe}</span>
          <span className="modal-footer-info" style={{ marginLeft: 'auto' }}>
            {finding.evidence.videoPath}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponent: Scan Progress ──────────────────────────────
function ScanProgress({ progress }) {
  if (!progress) return null;
  return (
    <div className="scan-progress">
      <div className="progress-header">
        <span className={`progress-phase ${progress.phase}`}>
          {progress.phase}
        </span>
        <span className="progress-pct">{progress.progress}%</span>
      </div>
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      <div className="progress-message">{progress.message}</div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [url, setUrl]                   = useState('');
  const [scanning, setScanning]         = useState(false);
  const [progress, setProgress]         = useState(null);
  const [findings, setFindings]         = useState([]);
  const [scanHistory, setScanHistory]   = useState([]);
  const [activeScanId, setActiveScanId] = useState(null);
  const [activeVideo, setActiveVideo]   = useState(null);
  const [wsConnected, setWsConnected]   = useState(false);
  const [pdfLoading, setPdfLoading]     = useState(false);

  // ── Scan Config state ─────────────────────────────────────────
  const [showConfig, setShowConfig]         = useState(false);
  const [scanMode, setScanMode]             = useState('full'); // 'quick' | 'full'
  const [selectedModules, setSelectedModules] = useState(
    OWASP_MODULES.map(m => m.id)  // all selected by default
  );

  const toggleModule = (id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const applyPreset = (mode) => {
    setScanMode(mode);
    setSelectedModules(mode === 'quick' ? QUICK_MODULES : OWASP_MODULES.map(m => m.id));
  };

  // WebSocket listeners
  useEffect(() => {
    socket.on('connect',    () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('scan:progress', ({ scanId, phase, message, progress: pct }) => {
      setProgress({ phase, message, progress: pct });
    });

    socket.on('scan:finding', ({ scanId, finding }) => {
      setFindings((prev) => [...prev, finding]);
    });

    socket.on('scan:complete', ({ scanId, scan }) => {
      setScanning(false);
      setProgress({ phase: 'done', message: `Scan complete. ${scan.findings.length} vulnerabilities found.`, progress: 100 });
      setScanHistory((prev) =>
        prev.map((h) => h.scanId === scanId ? { ...h, status: 'done', findings: scan.findings.length } : h)
      );
    });

    socket.on('scan:error', ({ scanId, message }) => {
      setScanning(false);
      setProgress({ phase: 'done', message: `Error: ${message}`, progress: 100 });
    });

    return () => socket.removeAllListeners();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim() || scanning) return;
    if (selectedModules.length === 0) {
      alert('Please select at least one OWASP module to scan.');
      return;
    }

    setScanning(true);
    setFindings([]);
    setProgress({ phase: 'crawling', message: 'Initiating scan...', progress: 0 });
    setShowConfig(false); // collapse config panel during scan

    try {
      const { data } = await axios.post(`${BACKEND}/api/scan`, {
        targetUrl: url,
        selectedModules,
      });
      setActiveScanId(data.scanId);
      setScanHistory((prev) => [
        {
          scanId: data.scanId,
          url,
          startedAt: new Date().toISOString(),
          status: 'scanning',
          findings: 0,
          modules: selectedModules.length,
        },
        ...prev,
      ]);
    } catch {
      setScanning(false);
      setProgress({ phase: 'done', message: 'Could not connect to scanner engine.', progress: 0 });
    }
  };

  const total     = findings.length;
  const criticals = findings.filter(f => f.severity === 'Critical').length;
  const highs     = findings.filter(f => f.severity === 'High').length;
  const recorded  = findings.filter(f => f.evidence?.videoPath).length;
  const scanDone  = progress?.phase === 'done' && total > 0;

  const handleDownloadPdf = () => {
    if (!activeScanId) return;
    setPdfLoading(true);
    // Open in new tab — browser will handle the PDF download
    const link = document.createElement('a');
    link.href = `${BACKEND}/api/reports/${activeScanId}/pdf`;
    link.download = `visivault-report-${activeScanId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setPdfLoading(false), 2000);
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <a className="logo" href="/">
            <div className="logo-icon">🛡️</div>
            <div>
              <div className="logo-text">VisiVault</div>
              <div className="logo-sub">OWASP Visual Scanner</div>
            </div>
          </a>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          <div className="nav-item active">
            <span className="nav-icon">🏠</span> Dashboard
          </div>
          <div className="nav-item">
            <span className="nav-icon">📹</span> Evidence Library
            {recorded > 0 && <span className="nav-badge">{recorded}</span>}
          </div>
          <div className="nav-item">
            <span className="nav-icon">📋</span> Reports
          </div>
          <div className="nav-item">
            <span className="nav-icon">⚙️</span> Settings
          </div>
        </nav>

        {scanHistory.length > 0 && (
          <div className="sidebar-history">
            <div className="nav-section-label">Recent Scans</div>
            {scanHistory.slice(0, 8).map((h) => (
              <div key={h.scanId} className="history-item">
                <div className="history-url" title={h.url}>{h.url}</div>
                <div className="history-meta">
                  <div className={`history-dot ${h.status}`} />
                  <span>{h.status}</span>
                  {h.findings > 0 && <span>· {h.findings} vulns</span>}
                  <span style={{ marginLeft: 'auto' }}>{fmtTime(h.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">Vulnerability Scanner</span>
          <div className="topbar-right">
            <div className={`status-pill ${wsConnected ? 'live' : ''}`}>
              <span className="pulse" />
              {wsConnected ? 'Engine Online' : 'Offline'}
            </div>
          </div>
        </header>

        <main className="page">
          {/* Stats */}
          <div className="stats-row">
            <StatCard icon="🔍" label="Total Findings"    value={total}     color="blue"   />
            <StatCard icon="🔴" label="Critical"          value={criticals} color="red"    />
            <StatCard icon="🟡" label="High Severity"     value={highs}     color="orange" />
            <StatCard icon="📹" label="Videos Recorded"   value={recorded}  color="green"  />
          </div>

          {/* Scanner */}
          <div className="scanner-card">
            <div className="scanner-card-header">
              <h2>Launch Scan</h2>
              <p>Enter a target URL. The engine will crawl, inject payloads, and record visual proof of each vulnerability found.</p>
            </div>

            <form className="scan-form" onSubmit={handleScan}>
              <div className="url-input-wrap">
                <span className="input-icon">&#x1F517;</span>
                <input
                  id="target-url"
                  className="url-input"
                  type="url"
                  placeholder="https://target-application.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={scanning}
                  required
                />
              </div>
              <button id="start-scan-btn" className="btn-scan" type="submit" disabled={scanning || selectedModules.length === 0}>
                {scanning ? <span className="spin">⟳</span> : '▶ '}
                {scanning ? 'Scanning...' : 'Start Scan'}
              </button>
            </form>

            {/* Config Toggle Bar */}
            <div className="config-toggle-bar">
              <button
                className={`config-toggle-btn ${showConfig ? 'open' : ''}`}
                onClick={() => setShowConfig(v => !v)}
                type="button"
                disabled={scanning}
              >
                <span className="config-toggle-icon">{showConfig ? '\u25B2' : '\u25BC'}</span>
                Configure Modules
                <span className="config-module-count">
                  {selectedModules.length}/{OWASP_MODULES.length} selected
                </span>
              </button>

              <div className="config-presets">
                <button
                  className={`preset-btn ${scanMode === 'quick' ? 'active' : ''}`}
                  onClick={() => applyPreset('quick')}
                  type="button"
                  disabled={scanning}
                  title="Runs the 4 most critical OWASP modules only"
                >
                  Quick (4)
                </button>
                <button
                  className={`preset-btn ${scanMode === 'full' ? 'active' : ''}`}
                  onClick={() => applyPreset('full')}
                  type="button"
                  disabled={scanning}
                  title="Runs all 10 OWASP Top 10 modules"
                >
                  Full (10)
                </button>
              </div>
            </div>

            {/* Collapsible Module Checkboxes */}
            {showConfig && (
              <div className="config-panel">
                <div className="config-modules-grid">
                  {OWASP_MODULES.map((mod) => {
                    const checked = selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`module-checkbox ${checked ? 'checked' : ''} sev-${mod.sev.toLowerCase()}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => { toggleModule(mod.id); setScanMode('custom'); }}
                          disabled={scanning}
                        />
                        <div className="module-checkbox-body">
                          <div className="module-checkbox-top">
                            <span className="module-id">{mod.id}</span>
                            <span className={`module-sev sev-tag-${mod.sev.toLowerCase()}`}>{mod.sev}</span>
                          </div>
                          <div className="module-label">{mod.label}</div>
                          <div className="module-desc">{mod.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedModules.length === 0 && (
                  <p className="config-warning">Select at least one module to start a scan.</p>
                )}
              </div>
            )}

            {(scanning || progress?.phase === 'done') && (
              <div style={{ marginTop: '1.25rem' }}>
                <ScanProgress progress={progress} />
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <div className="results-header">
              <h2>Findings</h2>
              {total > 0 && <span className="results-count">{total} vulnerabilities</span>}
              {scanDone && (
                <button
                  id="download-pdf-btn"
                  className="btn-pdf"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? '⏳ Generating...' : '📄 Export PDF'}
                </button>
              )}
            </div>

            <div className="results-grid">
              {findings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🛡️</div>
                  <h3>No findings yet</h3>
                  <p>Start a scan to detect OWASP Top 10 vulnerabilities with visual proof.</p>
                </div>
              ) : (
                findings.map((f) => (
                  <VulnCard key={f.id} finding={f} onPlay={setActiveVideo} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <VideoModal finding={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
