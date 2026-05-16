import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:5000';

// ── Severity helpers ──────────────────────────────────────────────────────
const SEV_CLASS  = { Critical: 'sev-critical', High: 'sev-high', Medium: 'sev-medium', Low: 'sev-low' };
const SEV_ORDER  = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const SEV_COLORS = { Critical: '#f85149', High: '#e3b341', Medium: '#4493f8', Low: '#3fb950' };

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(start, end) {
    if (!start || !end) return '—';
    const secs = Math.round((new Date(end) - new Date(start)) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ── Severity mini-bar ─────────────────────────────────────────────────────
function SeverityBar({ findings }) {
    const total = findings.length;
    if (total === 0) return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>No findings</span>;

    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

    return (
        <div className="sev-bar-wrap" title={Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')}>
            {['Critical', 'High', 'Medium', 'Low'].map(sev =>
                counts[sev] > 0 ? (
                    <div
                        key={sev}
                        className="sev-bar-seg"
                        style={{ width: `${(counts[sev] / total) * 100}%`, background: SEV_COLORS[sev] }}
                        title={`${sev}: ${counts[sev]}`}
                    />
                ) : null
            )}
        </div>
    );
}

// ── Severity count badges ──────────────────────────────────────────────────
function SevCounts({ findings }) {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });
    return (
        <div className="sev-counts">
            {['Critical', 'High', 'Medium', 'Low'].map(sev =>
                counts[sev] > 0 ? (
                    <span key={sev} className={`badge ${SEV_CLASS[sev]}`}>{counts[sev]} {sev}</span>
                ) : null
            )}
        </div>
    );
}

// ── Individual finding row inside an expanded scan ────────────────────────
function FindingRow({ finding, onPlay }) {
    const sc = SEV_CLASS[finding.severity] || 'sev-medium';
    return (
        <div className={`lib-finding-row ${sc}`}>
            <div className="lib-finding-left">
                <span className={`badge ${sc}`}>{finding.severity}</span>
                <span className="badge owasp">{finding.owaspId}</span>
                <span className="badge cwe">{finding.cwe}</span>
            </div>
            <div className="lib-finding-name">{finding.vulnerability}</div>
            {finding.evidence?.videoPath ? (
                <button className="lib-play-btn" onClick={() => onPlay(finding)}>
                    ▶ Play
                </button>
            ) : (
                <span className="lib-no-video">No video</span>
            )}
        </div>
    );
}

// ── Scan card (collapsed + expanded) ────────────────────────────────────────
function ScanCard({ scan, onPlay, onDownloadPdf }) {
    const [expanded, setExpanded] = useState(false);
    const [filter, setFilter]     = useState('All');

    const findings     = scan.findings || [];
    const isDone       = scan.status === 'done';
    const recorded     = findings.filter(f => f.evidence?.videoPath).length;
    const severities   = ['All', 'Critical', 'High', 'Medium', 'Low'];
    const visibleFindings = filter === 'All'
        ? findings
        : findings.filter(f => f.severity === filter);

    return (
        <div className={`lib-scan-card ${expanded ? 'expanded' : ''}`}>
            {/* Card header — always visible */}
            <div className="lib-scan-header" onClick={() => setExpanded(v => !v)}>
                <div className="lib-scan-header-left">
                    <div className={`history-dot ${scan.status}`} style={{ flexShrink: 0 }} />
                    <div>
                        <div className="lib-scan-url" title={scan.targetUrl}>{scan.targetUrl}</div>
                        <div className="lib-scan-meta">
                            {fmtDate(scan.startedAt)} &nbsp;·&nbsp; {fmtTime(scan.startedAt)}
                            {isDone && <> &nbsp;·&nbsp; {fmtDuration(scan.startedAt, scan.completedAt)}</>}
                            {scan.selectedModules?.length > 0 && (
                                <>&nbsp;·&nbsp; {scan.selectedModules.length} modules</>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lib-scan-header-right">
                    {isDone && <SeverityBar findings={findings} />}
                    <div className="lib-scan-counts">
                        <span className="lib-stat-pill">{findings.length} vulns</span>
                        {recorded > 0 && <span className="lib-stat-pill green">{recorded} videos</span>}
                    </div>
                    {isDone && (
                        <button
                            className="btn-pdf lib-pdf-btn"
                            onClick={(e) => { e.stopPropagation(); onDownloadPdf(scan.scanId); }}
                            title="Download PDF report"
                        >
                            PDF
                        </button>
                    )}
                    <span className="lib-chevron">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Expanded findings */}
            {expanded && (
                <div className="lib-scan-body">
                    {findings.length === 0 ? (
                        <p className="lib-empty">No findings recorded for this scan.</p>
                    ) : (
                        <>
                            <div className="lib-filter-bar">
                                <SevCounts findings={findings} />
                                <div className="lib-filter-tabs">
                                    {severities.map(s => (
                                        <button
                                            key={s}
                                            className={`lib-filter-tab ${filter === s ? 'active' : ''}`}
                                            onClick={() => setFilter(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="lib-findings-list">
                                {[...visibleFindings]
                                    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
                                    .map(f => (
                                        <FindingRow key={f.id} finding={f} onPlay={onPlay} />
                                    ))}
                                {visibleFindings.length === 0 && (
                                    <p className="lib-empty">No {filter} findings in this scan.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Summary stat card ────────────────────────────────────────────────────
function LibStat({ label, value, color }) {
    return (
        <div className="lib-summary-stat">
            <div className="lib-summary-value" style={{ color }}>{value}</div>
            <div className="lib-summary-label">{label}</div>
        </div>
    );
}

// ── Main Evidence Library Page ────────────────────────────────────────────
export default function EvidenceLibrary({ onPlay }) {
    const [scans, setScans]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState('');

    const loadHistory = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${BACKEND}/api/history`);
            setScans(data);
        } catch (e) {
            console.error('Failed to load history', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);

    const handleDownloadPdf = (scanId) => {
        const link = document.createElement('a');
        link.href = `${BACKEND}/api/reports/${scanId}/pdf`;
        link.download = `visivault-report-${scanId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Computed stats ──────────────────────────────────────────
    const donescans   = scans.filter(s => s.status === 'done');
    const allFindings = donescans.flatMap(s => s.findings || []);
    const totalVideos = allFindings.filter(f => f.evidence?.videoPath).length;
    const critCount   = allFindings.filter(f => f.severity === 'Critical').length;

    // ── Search filter ───────────────────────────────────────────
    const filtered = search.trim()
        ? scans.filter(s =>
            s.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
            (s.findings || []).some(f => f.vulnerability.toLowerCase().includes(search.toLowerCase()))
          )
        : scans;

    return (
        <div className="lib-page">
            {/* Summary Stats */}
            <div className="lib-summary-row">
                <LibStat label="Total Scans"    value={scans.length}      color="var(--accent)"   />
                <LibStat label="Total Findings" value={allFindings.length} color="var(--text)"    />
                <LibStat label="Critical"       value={critCount}          color="var(--sev-critical)" />
                <LibStat label="Videos Recorded" value={totalVideos}       color="var(--green)"   />
            </div>

            {/* Search + Refresh */}
            <div className="lib-toolbar">
                <input
                    className="lib-search"
                    placeholder="Search by URL or vulnerability name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button className="lib-refresh-btn" onClick={loadHistory}>
                    ↻ Refresh
                </button>
            </div>

            {/* Scan list */}
            {loading ? (
                <div className="lib-loading">
                    <span className="spin" style={{ fontSize: '1.5rem' }}>⟳</span>
                    <p>Loading scan history...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <h3>{search ? 'No matching scans' : 'No scan history yet'}</h3>
                    <p>{search ? 'Try a different search term.' : 'Run your first scan from the Dashboard to see it here.'}</p>
                </div>
            ) : (
                <div className="lib-scan-list">
                    {filtered.map(scan => (
                        <ScanCard
                            key={scan.scanId}
                            scan={scan}
                            onPlay={onPlay}
                            onDownloadPdf={handleDownloadPdf}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
