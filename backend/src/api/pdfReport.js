const PDFDocument = require('pdfkit');

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
    bg:           '#060912',
    panel:        '#161b22',
    border:       '#30363d',
    text:         '#e6edf3',
    muted:        '#7d8590',
    accent:       '#4493f8',
    purple:       '#a371f7',
    critical:     '#f85149',
    high:         '#e3b341',
    medium:       '#4493f8',
    low:          '#3fb950',
    white:        '#ffffff',
    green:        '#3fb950',
};

// Hex → r,g,b for PDFKit fillColor calls
function hex(h) { return h; }

const SEV_COLOR = {
    Critical: COLORS.critical,
    High:     COLORS.high,
    Medium:   COLORS.medium,
    Low:      COLORS.low,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Draw a filled rectangle */
function fillRect(doc, x, y, w, h, color) {
    doc.save().rect(x, y, w, h).fill(color).restore();
}

/** Draw a rounded rectangle outline */
function strokeRoundedRect(doc, x, y, w, h, r, color, lineWidth = 0.5) {
    doc.save().roundedRect(x, y, w, h, r).strokeColor(color).lineWidth(lineWidth).stroke().restore();
}

/** Wrap text manually and return number of lines used */
function textLines(doc, text, x, y, opts) {
    doc.text(text, x, y, opts);
    return doc.y;
}

/** Draw a horizontal rule */
function hRule(doc, y, color = COLORS.border) {
    doc.save().moveTo(50, y).lineTo(562, y).strokeColor(color).lineWidth(0.5).stroke().restore();
}

/** Severity pill */
function severityPill(doc, x, y, severity) {
    const color = SEV_COLOR[severity] || COLORS.medium;
    const w = 60; const h = 14; const r = 4;
    doc.save()
       .roundedRect(x, y, w, h, r)
       .fill(color + '33')  // 20% opacity fill
       .restore();
    doc.save()
       .roundedRect(x, y, w, h, r)
       .strokeColor(color)
       .lineWidth(0.7)
       .stroke()
       .restore();
    doc.save()
       .fillColor(color)
       .font('Helvetica-Bold')
       .fontSize(7)
       .text(severity.toUpperCase(), x, y + 3.5, { width: w, align: 'center' })
       .restore();
}

// ── Page helpers ──────────────────────────────────────────────────────────────
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addPageHeader(doc, scanId, pageNum) {
    // Top bar
    fillRect(doc, 0, 0, PAGE_W, 36, '#0d1117');
    doc.save()
       .fillColor(COLORS.accent)
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('VisiVault', MARGIN, 13)
       .restore();
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(7)
       .text(`Scan ID: ${scanId}`, 0, 14, { width: PAGE_W - MARGIN, align: 'right' })
       .restore();
    hRule(doc, 36, '#21262d');
}

function addPageFooter(doc, pageNum, totalPages) {
    hRule(doc, PAGE_H - 36, '#21262d');
    fillRect(doc, 0, PAGE_H - 36, PAGE_W, 36, '#0d1117');
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(7)
       .text('CONFIDENTIAL — VisiVault Security Report', MARGIN, PAGE_H - 20)
       .restore();
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(7)
       .text(`Page ${pageNum}`, 0, PAGE_H - 20, { width: PAGE_W - MARGIN, align: 'right' })
       .restore();
}

// ── Cover Page ─────────────────────────────────────────────────────────────
function buildCoverPage(doc, scan) {
    const now = new Date(scan.startedAt);

    // Dark full-page background
    fillRect(doc, 0, 0, PAGE_W, PAGE_H, '#060912');

    // Accent gradient strip on the left
    fillRect(doc, 0, 0, 6, PAGE_H, COLORS.accent);

    // Shield emoji area (big, centered-ish)
    doc.save()
       .fillColor(COLORS.accent)
       .font('Helvetica-Bold')
       .fontSize(48)
       .text('🛡', MARGIN + 10, 110)
       .restore();

    doc.save()
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(30)
       .text('Security Assessment', MARGIN, 175)
       .restore();

    doc.save()
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(30)
       .text('Report', MARGIN, 212)
       .restore();

    doc.save()
       .fillColor(COLORS.accent)
       .font('Helvetica')
       .fontSize(13)
       .text('OWASP Top 10 Visual Exploit Simulation', MARGIN, 255)
       .restore();

    // Divider
    hRule(doc, 285, COLORS.accent);

    // Target info block
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(9)
       .text('TARGET APPLICATION', MARGIN, 302)
       .restore();

    doc.save()
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(scan.targetUrl, MARGIN, 318, { width: CONTENT_W })
       .restore();

    // Info grid
    const infoY = 365;
    const col = CONTENT_W / 3;
    const infos = [
        ['Scan Date',   now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })],
        ['Scan Time',   now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })],
        ['Scan Status', scan.status.toUpperCase()],
    ];
    infos.forEach(([label, value], i) => {
        const x = MARGIN + i * col;
        doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(label, x, infoY).restore();
        doc.save().fillColor(COLORS.white).font('Helvetica-Bold').fontSize(10).text(value, x, infoY + 14).restore();
    });

    // Finding counts
    const findings = scan.findings || [];
    const critCount = findings.filter(f => f.severity === 'Critical').length;
    const highCount = findings.filter(f => f.severity === 'High').length;
    const medCount  = findings.filter(f => f.severity === 'Medium').length;
    const lowCount  = findings.filter(f => f.severity === 'Low').length;

    const statsY = 430;
    fillRect(doc, MARGIN, statsY, CONTENT_W, 90, '#0d1117');
    strokeRoundedRect(doc, MARGIN, statsY, CONTENT_W, 90, 6, COLORS.border);

    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(8)
       .text('VULNERABILITY SUMMARY', MARGIN + 16, statsY + 14)
       .restore();

    const statItems = [
        ['Total',    findings.length, COLORS.accent],
        ['Critical', critCount,       COLORS.critical],
        ['High',     highCount,       COLORS.high],
        ['Medium',   medCount,        COLORS.medium],
        ['Low',      lowCount,        COLORS.low],
    ];
    const statColW = CONTENT_W / statItems.length;
    statItems.forEach(([label, count, color], i) => {
        const x = MARGIN + i * statColW + 16;
        doc.save().fillColor(color).font('Helvetica-Bold').fontSize(22).text(String(count), x, statsY + 36).restore();
        doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(label, x, statsY + 64).restore();
    });

    // Bottom note
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(8)
       .text(
           'This report was generated automatically by VisiVault. Each vulnerability includes a recorded video demonstrating the exploit. Treat this document as CONFIDENTIAL.',
           MARGIN, PAGE_H - 100,
           { width: CONTENT_W, align: 'center' }
       )
       .restore();

    addPageFooter(doc, 1, '?');
}

// ── Executive Summary Page ─────────────────────────────────────────────────
function buildSummaryPage(doc, scan) {
    doc.addPage();
    fillRect(doc, 0, 0, PAGE_W, PAGE_H, '#060912');
    addPageHeader(doc, scan.scanId, 2);

    let y = 56;

    doc.save()
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('Executive Summary', MARGIN, y)
       .restore();
    y += 32;

    // Risk score
    const findings = scan.findings || [];
    const critCount = findings.filter(f => f.severity === 'Critical').length;
    const highCount = findings.filter(f => f.severity === 'High').length;
    const riskScore = Math.min(10, (critCount * 2.5 + highCount * 1.5)).toFixed(1);
    const riskLabel = riskScore >= 8 ? 'CRITICAL RISK' : riskScore >= 5 ? 'HIGH RISK' : 'MEDIUM RISK';
    const riskColor = riskScore >= 8 ? COLORS.critical : riskScore >= 5 ? COLORS.high : COLORS.medium;

    fillRect(doc, MARGIN, y, CONTENT_W, 56, '#0d1117');
    strokeRoundedRect(doc, MARGIN, y, CONTENT_W, 56, 6, riskColor, 1);
    doc.save().fillColor(riskColor).font('Helvetica-Bold').fontSize(28).text(riskScore, MARGIN + 20, y + 10).restore();
    doc.save().fillColor(riskColor).font('Helvetica-Bold').fontSize(10).text('/ 10', MARGIN + 55, y + 20).restore();
    doc.save().fillColor(riskColor).font('Helvetica-Bold').fontSize(10).text(riskLabel, MARGIN + 80, y + 10).restore();
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(8)
       .text(`Based on ${findings.length} vulnerabilities found: ${critCount} Critical, ${highCount} High`, MARGIN + 80, y + 28)
       .restore();
    y += 72;

    // Scope
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('SCAN SCOPE', MARGIN, y).restore();
    y += 14;
    doc.save().fillColor(COLORS.text).font('Helvetica').fontSize(10)
       .text(`The automated VisiVault scanner performed an OWASP Top 10 assessment against ${scan.targetUrl}. The scanner tested for all ten vulnerability categories defined in the OWASP Top 10 (2021) standard, injected attack payloads, and recorded video evidence for each confirmed finding.`, MARGIN, y, { width: CONTENT_W })
       .restore();
    y += 58;
    hRule(doc, y, COLORS.border);
    y += 16;

    // Findings table
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('FINDINGS OVERVIEW', MARGIN, y).restore();
    y += 14;

    // Table header
    fillRect(doc, MARGIN, y, CONTENT_W, 22, '#0d1117');
    strokeRoundedRect(doc, MARGIN, y, CONTENT_W, 22, 0, COLORS.border);
    const cols = [0, 0.36, 0.55, 0.72, 1.0];
    const headers = ['Vulnerability', 'OWASP ID', 'Severity', 'Evidence'];
    headers.forEach((h, i) => {
        const x = MARGIN + cols[i] * CONTENT_W + 8;
        doc.save().fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5).text(h, x, y + 7).restore();
    });
    y += 22;

    findings.forEach((f, idx) => {
        const rowH = 22;
        const rowBg = idx % 2 === 0 ? '#0d1117' : '#111827';
        fillRect(doc, MARGIN, y, CONTENT_W, rowH, rowBg);
        strokeRoundedRect(doc, MARGIN, y, CONTENT_W, rowH, 0, '#1f2937', 0.3);

        const colData = [
            { text: f.vulnerability.length > 32 ? f.vulnerability.substring(0, 30) + '…' : f.vulnerability, color: COLORS.text },
            { text: f.owaspId, color: COLORS.purple },
            { text: '', color: '' }, // pill rendered separately
            { text: f.evidence?.videoPath ? '📹 Recorded' : '—', color: f.evidence?.videoPath ? COLORS.green : COLORS.muted },
        ];

        colData.forEach((c, i) => {
            if (i === 2) { severityPill(doc, MARGIN + cols[i] * CONTENT_W + 8, y + 4, f.severity); return; }
            const x = MARGIN + cols[i] * CONTENT_W + 8;
            doc.save().fillColor(c.color).font('Helvetica').fontSize(8).text(c.text, x, y + 7).restore();
        });
        y += rowH;
    });

    y += 20;
    hRule(doc, y, COLORS.border);
    y += 16;

    // Key recommendations
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('KEY RECOMMENDATIONS', MARGIN, y).restore();
    y += 14;

    const topFindings = findings.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 3);
    topFindings.forEach((f, i) => {
        doc.save().fillColor(COLORS.critical).font('Helvetica-Bold').fontSize(8.5).text(`${i + 1}.  ${f.vulnerability}`, MARGIN, y).restore();
        y += 14;
        doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8)
           .text(f.remediation, MARGIN + 14, y, { width: CONTENT_W - 14 })
           .restore();
        y += doc.currentLineHeight() * 2.2 + 8;
    });

    addPageFooter(doc, 2, '?');
}

// ── Per-Finding Pages ──────────────────────────────────────────────────────
function buildFindingPage(doc, finding, pageNum, scan) {
    doc.addPage();
    fillRect(doc, 0, 0, PAGE_W, PAGE_H, '#060912');
    addPageHeader(doc, scan.scanId, pageNum);

    const sevColor = SEV_COLOR[finding.severity] || COLORS.medium;

    // Left accent bar tinted by severity
    fillRect(doc, 0, 0, 4, PAGE_H, sevColor);

    let y = 56;

    // Severity pill + OWASP badge
    severityPill(doc, MARGIN, y, finding.severity);

    doc.save()
       .fillColor(COLORS.purple)
       .font('Helvetica-Bold')
       .fontSize(7)
       .text(finding.owaspId, MARGIN + 68, y + 3)
       .restore();

    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(7)
       .text(finding.cwe, MARGIN + 68 + 55, y + 3)
       .restore();

    y += 22;

    // Title
    doc.save()
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(finding.vulnerability, MARGIN, y, { width: CONTENT_W })
       .restore();
    y += 28;

    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(9)
       .text(finding.owaspName, MARGIN, y)
       .restore();
    y += 22;

    hRule(doc, y, COLORS.border);
    y += 16;

    // Description section
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('DESCRIPTION', MARGIN, y).restore();
    y += 14;
    doc.save()
       .fillColor(COLORS.text)
       .font('Helvetica')
       .fontSize(9.5)
       .text(finding.description, MARGIN, y, { width: CONTENT_W, lineGap: 2 })
       .restore();
    y = doc.y + 20;

    // Affected URL
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('AFFECTED URL', MARGIN, y).restore();
    y += 14;
    fillRect(doc, MARGIN, y, CONTENT_W, 26, '#0d1117');
    strokeRoundedRect(doc, MARGIN, y, CONTENT_W, 26, 4, COLORS.border);
    doc.save()
       .fillColor(COLORS.accent)
       .font('Helvetica')
       .fontSize(9)
       .text(finding.url, MARGIN + 10, y + 8, { width: CONTENT_W - 20 })
       .restore();
    y += 40;

    hRule(doc, y, COLORS.border);
    y += 16;

    // Remediation
    doc.save().fillColor(COLORS.green).font('Helvetica-Bold').fontSize(8).text('REMEDIATION', MARGIN, y).restore();
    y += 14;
    fillRect(doc, MARGIN, y, 3, 999, COLORS.green); // green left accent — clipped by content
    doc.save()
       .fillColor(COLORS.text)
       .font('Helvetica')
       .fontSize(9.5)
       .text(finding.remediation, MARGIN + 14, y, { width: CONTENT_W - 14, lineGap: 2 })
       .restore();
    y = doc.y + 20;

    hRule(doc, y, COLORS.border);
    y += 16;

    // Evidence
    doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('VISUAL EVIDENCE', MARGIN, y).restore();
    y += 14;

    if (finding.evidence?.videoPath) {
        fillRect(doc, MARGIN, y, CONTENT_W, 52, '#0d1117');
        strokeRoundedRect(doc, MARGIN, y, CONTENT_W, 52, 6, COLORS.green, 0.8);
        doc.save().fillColor(COLORS.green).font('Helvetica-Bold').fontSize(10).text('📹  Exploit Recorded', MARGIN + 16, y + 10).restore();
        doc.save()
           .fillColor(COLORS.muted)
           .font('Helvetica')
           .fontSize(8)
           .text(`Video file: ${finding.evidence.videoPath}`, MARGIN + 16, y + 28)
           .restore();
    } else {
        fillRect(doc, MARGIN, y, CONTENT_W, 36, '#0d1117');
        strokeRoundedRect(doc, MARGIN, y, CONTENT_W, 36, 6, COLORS.border);
        doc.save().fillColor(COLORS.muted).font('Helvetica').fontSize(9).text('Video evidence not available for this finding.', MARGIN + 16, y + 12).restore();
    }

    // Timestamp
    y += 70;
    doc.save()
       .fillColor(COLORS.muted)
       .font('Helvetica')
       .fontSize(7.5)
       .text(`Detected at: ${new Date(finding.timestamp).toLocaleString()}  ·  Scan ID: ${scan.scanId}`, MARGIN, y)
       .restore();

    addPageFooter(doc, pageNum, '?');
}

// ── Main Generator ────────────────────────────────────────────────────────
function generatePdfReport(scan, res) {
    const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        info: {
            Title:    'VisiVault Security Report',
            Author:   'VisiVault OWASP Scanner',
            Subject:  `Security Assessment: ${scan.targetUrl}`,
            Keywords: 'OWASP, security, vulnerability, penetration testing',
        },
    });

    // Stream directly to HTTP response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="visivault-report-${scan.scanId.slice(0, 8)}.pdf"`
    );
    doc.pipe(res);

    // Build pages
    buildCoverPage(doc, scan);
    buildSummaryPage(doc, scan);

    const findings = scan.findings || [];
    findings.forEach((finding, i) => {
        buildFindingPage(doc, finding, i + 3, scan);
    });

    doc.end();
}

module.exports = { generatePdfReport };
