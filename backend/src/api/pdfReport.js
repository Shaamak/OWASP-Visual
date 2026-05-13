const PDFDocument = require('pdfkit');

// ── Color palette ────────────────────────────────────────────────────────────
const C = {
    bg:       '#060912',
    panel:    '#0d1117',
    border:   '#30363d',
    text:     '#e6edf3',
    muted:    '#7d8590',
    dim:      '#484f58',
    accent:   '#4493f8',
    purple:   '#a371f7',
    green:    '#3fb950',
    white:    '#ffffff',
    critical: '#f85149',
    high:     '#e3b341',
    medium:   '#4493f8',
    low:      '#3fb950',
};

const SEV_COLOR = { Critical: C.critical, High: C.high, Medium: C.medium, Low: C.low };

const PAGE_W    = 612;
const PAGE_H    = 792;
const MARGIN    = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Low-level drawing helpers ────────────────────────────────────────────────

function rect(doc, x, y, w, h, fill, opacity = 1) {
    doc.save().fillOpacity(opacity).rect(x, y, w, h).fill(fill).restore();
}

function roundRect(doc, x, y, w, h, r, fill, opacity = 1) {
    doc.save().fillOpacity(opacity).roundedRect(x, y, w, h, r).fill(fill).restore();
}

function strokeRRect(doc, x, y, w, h, r, color, lw = 0.6) {
    doc.save().roundedRect(x, y, w, h, r).strokeColor(color).lineWidth(lw).stroke().restore();
}

function hRule(doc, y, color = C.border, opacity = 1) {
    doc.save().fillOpacity(opacity).moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
       .strokeColor(color).lineWidth(0.5).stroke().restore();
}

function text(doc, str, x, y, opts = {}) {
    const { color = C.text, font = 'Helvetica', size = 9, width, align, lineGap } = opts;
    const args = { width, align, lineGap };
    // strip undefined keys
    Object.keys(args).forEach(k => args[k] === undefined && delete args[k]);
    doc.save().fillColor(color).font(font).fontSize(size).text(str, x, y, args).restore();
    return doc.y;
}

// Severity badge (text-only, no emoji)
function sevBadge(doc, x, y, severity) {
    const color = SEV_COLOR[severity] || C.medium;
    const w = 58; const h = 14; const r = 3;
    roundRect(doc, x, y, w, h, r, color, 0.15);
    strokeRRect(doc, x, y, w, h, r, color, 0.7);
    text(doc, severity.toUpperCase(), x, y + 3.5, { color, font: 'Helvetica-Bold', size: 7, width: w, align: 'center' });
}

function owaspBadge(doc, x, y, label) {
    const w = 70; const h = 14; const r = 3;
    roundRect(doc, x, y, w, h, r, C.purple, 0.1);
    strokeRRect(doc, x, y, w, h, r, C.purple, 0.5);
    text(doc, label, x, y + 3.5, { color: C.purple, font: 'Helvetica-Bold', size: 7, width: w, align: 'center' });
}

function smallLabel(doc, str, x, y, color = C.muted) {
    text(doc, str.toUpperCase(), x, y, { color, font: 'Helvetica-Bold', size: 7.5, letterSpacing: 0.06 });
}

// ── Page chrome ──────────────────────────────────────────────────────────────

function pageHeader(doc, scanId) {
    rect(doc, 0, 0, PAGE_W, 36, C.panel);
    text(doc, 'VisiVault', MARGIN, 13, { color: C.accent, font: 'Helvetica-Bold', size: 9 });
    text(doc, `Scan: ${scanId.slice(0, 18)}...`, MARGIN, 13, {
        color: C.muted, size: 7.5, width: CONTENT_W, align: 'right',
    });
    doc.save().moveTo(0, 36).lineTo(PAGE_W, 36).strokeColor(C.border).lineWidth(0.4).stroke().restore();
}

function pageFooter(doc, pageNum) {
    doc.save().moveTo(0, PAGE_H - 36).lineTo(PAGE_W, PAGE_H - 36)
       .strokeColor(C.border).lineWidth(0.4).stroke().restore();
    rect(doc, 0, PAGE_H - 36, PAGE_W, 36, C.panel);
    text(doc, 'CONFIDENTIAL -- VisiVault Security Assessment Report', MARGIN, PAGE_H - 22, { color: C.dim, size: 7.5 });
    text(doc, `Page ${pageNum}`, MARGIN, PAGE_H - 22, { color: C.dim, size: 7.5, width: CONTENT_W, align: 'right' });
}

// ── Cover Page ───────────────────────────────────────────────────────────────

function buildCover(doc, scan) {
    rect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);

    // Left accent strip
    rect(doc, 0, 0, 5, PAGE_H, C.accent);

    // Decorative top-right corner block
    roundRect(doc, PAGE_W - 180, 60, 150, 150, 12, C.accent, 0.04);
    strokeRRect(doc, PAGE_W - 180, 60, 150, 150, 12, C.accent, 0.15);

    // Title block
    text(doc, 'SECURITY', MARGIN, 100, { color: C.white, font: 'Helvetica-Bold', size: 40 });
    text(doc, 'ASSESSMENT', MARGIN, 148, { color: C.white, font: 'Helvetica-Bold', size: 40 });
    text(doc, 'REPORT', MARGIN, 196, { color: C.accent, font: 'Helvetica-Bold', size: 40 });

    text(doc, 'OWASP Top 10 -- Visual Exploit Simulation', MARGIN, 252, {
        color: C.muted, size: 11,
    });

    // Rule
    doc.save().moveTo(MARGIN, 278).lineTo(MARGIN + CONTENT_W, 278)
       .strokeColor(C.accent).lineWidth(1).stroke().restore();

    // Target info
    smallLabel(doc, 'Target Application', MARGIN, 295);
    text(doc, scan.targetUrl, MARGIN, 312, { color: C.white, font: 'Helvetica-Bold', size: 12, width: CONTENT_W });

    // Meta grid
    const now = new Date(scan.startedAt);
    const cols = [
        ['Scan Date', now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
        ['Scan Time', now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
        ['Status',    scan.status.toUpperCase()],
    ];
    const colW = CONTENT_W / 3;
    cols.forEach(([label, val], i) => {
        const x = MARGIN + i * colW;
        smallLabel(doc, label, x, 360);
        text(doc, val, x, 376, { color: C.white, font: 'Helvetica-Bold', size: 11 });
    });

    // Summary box
    const findings  = scan.findings || [];
    const critical  = findings.filter(f => f.severity === 'Critical').length;
    const high      = findings.filter(f => f.severity === 'High').length;
    const medium    = findings.filter(f => f.severity === 'Medium').length;
    const low       = findings.filter(f => f.severity === 'Low').length;

    const boxY = 420;
    roundRect(doc, MARGIN, boxY, CONTENT_W, 100, 8, C.panel);
    strokeRRect(doc, MARGIN, boxY, CONTENT_W, 100, 8, C.border);
    smallLabel(doc, 'Vulnerability Summary', MARGIN + 16, boxY + 14);

    const stats = [
        ['Total',    findings.length, C.accent],
        ['Critical', critical,        C.critical],
        ['High',     high,            C.high],
        ['Medium',   medium,          C.medium],
        ['Low',      low,             C.low],
    ];
    const sW = CONTENT_W / stats.length;
    stats.forEach(([label, count, color], i) => {
        const x = MARGIN + i * sW + 16;
        text(doc, String(count), x, boxY + 38, { color, font: 'Helvetica-Bold', size: 26 });
        smallLabel(doc, label, x, boxY + 72, C.muted);
    });

    // Footer note
    text(doc,
        'This report was automatically generated by VisiVault. ' +
        'Each finding includes a recorded video demonstrating the exploit. ' +
        'Treat this document as CONFIDENTIAL.',
        MARGIN, PAGE_H - 80,
        { color: C.dim, size: 8, width: CONTENT_W, align: 'center' }
    );

    pageFooter(doc, 1);
}

// ── Executive Summary Page ────────────────────────────────────────────────────

function buildSummary(doc, scan) {
    doc.addPage();
    rect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);
    pageHeader(doc, scan.scanId);

    let y = 56;

    text(doc, 'Executive Summary', MARGIN, y, { color: C.white, font: 'Helvetica-Bold', size: 20 });
    y += 36;

    // Risk score
    const findings  = scan.findings || [];
    const critical  = findings.filter(f => f.severity === 'Critical').length;
    const high      = findings.filter(f => f.severity === 'High').length;
    const riskScore = Math.min(10, critical * 2.5 + high * 1.5).toFixed(1);
    const riskColor = riskScore >= 8 ? C.critical : riskScore >= 5 ? C.high : C.medium;
    const riskLabel = riskScore >= 8 ? 'CRITICAL RISK' : riskScore >= 5 ? 'HIGH RISK' : 'MEDIUM RISK';

    roundRect(doc, MARGIN, y, CONTENT_W, 56, 6, C.panel);
    strokeRRect(doc, MARGIN, y, CONTENT_W, 56, 6, riskColor, 1.2);
    text(doc, riskScore, MARGIN + 20, y + 8, { color: riskColor, font: 'Helvetica-Bold', size: 28 });
    text(doc, '/ 10', MARGIN + 64, y + 20, { color: riskColor, size: 10 });
    text(doc, riskLabel, MARGIN + 94, y + 8, { color: riskColor, font: 'Helvetica-Bold', size: 11 });
    text(doc,
        `Based on ${findings.length} vulnerabilities: ${critical} Critical, ${high} High`,
        MARGIN + 94, y + 28, { color: C.muted, size: 8.5 }
    );
    y += 72;

    // Scope paragraph
    smallLabel(doc, 'Scope', MARGIN, y);
    y += 14;
    text(doc,
        `The VisiVault automated scanner performed a full OWASP Top 10 (2021) assessment against ${scan.targetUrl}. ` +
        `Payloads were injected across all discovered input vectors. Each confirmed vulnerability was visually ` +
        `recorded using a headless browser session.`,
        MARGIN, y, { color: C.text, size: 9.5, width: CONTENT_W, lineGap: 2 }
    );
    y = doc.y + 16;
    hRule(doc, y);
    y += 16;

    // Findings table
    smallLabel(doc, 'Findings Overview', MARGIN, y);
    y += 14;

    // Table header row
    rect(doc, MARGIN, y, CONTENT_W, 22, '#0d1117');
    strokeRRect(doc, MARGIN, y, CONTENT_W, 22, 0, C.border, 0.5);

    const cols = [
        { label: 'Vulnerability',   x: MARGIN + 8,            w: 170 },
        { label: 'OWASP ID',        x: MARGIN + 8 + 178,      w: 80  },
        { label: 'Severity',        x: MARGIN + 8 + 260,      w: 70  },
        { label: 'CWE',             x: MARGIN + 8 + 332,      w: 60  },
        { label: 'Evidence',        x: MARGIN + 8 + 394,      w: 60  },
    ];

    cols.forEach(c => {
        text(doc, c.label, c.x, y + 7, { color: C.muted, font: 'Helvetica-Bold', size: 7.5 });
    });
    y += 22;

    findings.forEach((f, idx) => {
        const rowH  = 22;
        const rowBg = idx % 2 === 0 ? '#0d1117' : '#111827';
        rect(doc, MARGIN, y, CONTENT_W, rowH, rowBg);

        const name = f.vulnerability.length > 28 ? f.vulnerability.slice(0, 26) + '...' : f.vulnerability;
        const row = [
            { val: name,                         color: C.text   },
            { val: f.owaspId,                    color: C.purple },
            { val: '',                           color: ''       }, // pill
            { val: f.cwe,                        color: C.muted  },
            { val: f.evidence?.videoPath ? 'Recorded' : '--', color: f.evidence?.videoPath ? C.green : C.dim },
        ];
        row.forEach((cell, i) => {
            if (i === 2) { sevBadge(doc, cols[i].x, y + 4, f.severity); return; }
            text(doc, cell.val, cols[i].x, y + 7, { color: cell.color, size: 8 });
        });
        y += rowH;
    });

    y += 18;
    hRule(doc, y);
    y += 16;

    // Top recommendations
    if (y < PAGE_H - 120) {
        smallLabel(doc, 'Priority Recommendations', MARGIN, y);
        y += 14;
        const topFindings = findings.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 3);
        topFindings.forEach((f, i) => {
            if (y > PAGE_H - 80) return;
            text(doc, `${i + 1}.  ${f.vulnerability}`, MARGIN, y, { color: C.text, font: 'Helvetica-Bold', size: 9 });
            y += 14;
            const endY = text(doc, f.remediation, MARGIN + 14, y, {
                color: C.muted, size: 8.5, width: CONTENT_W - 14, lineGap: 1.5,
            });
            y = endY + 12;
        });
    }

    pageFooter(doc, 2);
}

// ── Per-Finding Page ─────────────────────────────────────────────────────────

function buildFinding(doc, finding, pageNum, scan) {
    doc.addPage();
    rect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);
    pageHeader(doc, scan.scanId);

    const sevColor = SEV_COLOR[finding.severity] || C.medium;

    // Severity accent bar on left
    rect(doc, 0, 0, 4, PAGE_H, sevColor);

    let y = 54;

    // Badges row
    sevBadge(doc, MARGIN, y, finding.severity);
    owaspBadge(doc, MARGIN + 66, y, finding.owaspId);
    text(doc, finding.cwe, MARGIN + 144, y + 3.5, { color: C.dim, size: 7.5 });
    y += 24;

    // Vulnerability title
    text(doc, finding.vulnerability, MARGIN, y, { color: C.white, font: 'Helvetica-Bold', size: 16, width: CONTENT_W });
    y += 26;
    text(doc, finding.owaspName, MARGIN, y, { color: C.muted, size: 9 });
    y += 20;

    hRule(doc, y);
    y += 14;

    // Description
    smallLabel(doc, 'Description', MARGIN, y);
    y += 13;
    const descEndY = text(doc, finding.description, MARGIN, y, {
        color: C.text, size: 9.5, width: CONTENT_W, lineGap: 2,
    });
    y = descEndY + 16;

    // Affected URL
    smallLabel(doc, 'Affected URL', MARGIN, y);
    y += 13;
    roundRect(doc, MARGIN, y, CONTENT_W, 26, 4, C.panel);
    strokeRRect(doc, MARGIN, y, CONTENT_W, 26, 4, C.border);
    text(doc, finding.url, MARGIN + 10, y + 8, { color: C.accent, size: 9, width: CONTENT_W - 20 });
    y += 40;

    hRule(doc, y);
    y += 14;

    // Remediation
    smallLabel(doc, 'Remediation', MARGIN, y, C.green);
    y += 13;
    // Green left bar
    rect(doc, MARGIN, y, 3, 200, C.green, 0.6); // over-tall, clipped visually
    const remEndY = text(doc, finding.remediation, MARGIN + 12, y, {
        color: C.text, size: 9.5, width: CONTENT_W - 12, lineGap: 2,
    });
    y = remEndY + 18;

    hRule(doc, y);
    y += 14;

    // Evidence reference (compact — no blank space)
    smallLabel(doc, 'Evidence', MARGIN, y);
    y += 13;

    if (finding.evidence?.videoPath) {
        roundRect(doc, MARGIN, y, CONTENT_W, 32, 4, C.panel);
        strokeRRect(doc, MARGIN, y, CONTENT_W, 32, 4, C.green, 0.7);
        text(doc, 'Video evidence recorded', MARGIN + 12, y + 7, {
            color: C.green, font: 'Helvetica-Bold', size: 9,
        });
        text(doc, `File: ${finding.evidence.videoPath}`, MARGIN + 12, y + 20, {
            color: C.muted, size: 7.5, width: CONTENT_W - 24,
        });
    } else {
        roundRect(doc, MARGIN, y, CONTENT_W, 24, 4, C.panel);
        strokeRRect(doc, MARGIN, y, CONTENT_W, 24, 4, C.border);
        text(doc, 'No evidence recorded for this finding.', MARGIN + 12, y + 7, {
            color: C.dim, size: 8.5,
        });
    }
    y += 40;

    // Timestamp footer line
    text(doc,
        `Detected: ${new Date(finding.timestamp).toLocaleString()}   |   Scan ID: ${scan.scanId}`,
        MARGIN, y, { color: C.dim, size: 7.5 }
    );

    pageFooter(doc, pageNum);
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

function generatePdfReport(scan, res) {
    const doc = new PDFDocument({
        size:    'LETTER',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        info: {
            Title:    'VisiVault Security Report',
            Author:   'VisiVault OWASP Scanner',
            Subject:  `Security Assessment: ${scan.targetUrl}`,
            Keywords: 'OWASP, security, vulnerability, penetration testing',
        },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="visivault-report-${scan.scanId.slice(0, 8)}.pdf"`
    );
    doc.pipe(res);

    buildCover(doc, scan);
    buildSummary(doc, scan);
    (scan.findings || []).forEach((f, i) => buildFinding(doc, f, i + 3, scan));

    doc.end();
}

module.exports = { generatePdfReport };
