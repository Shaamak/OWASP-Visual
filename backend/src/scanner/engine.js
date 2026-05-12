const simulator = require('../simulator/browser');
const demonstrateXSS = require('../simulator/scenarios/demonstrateXSS');
const demonstrateAuthBypass = require('../simulator/scenarios/demonstrateAuthBypass');
const demonstrateIDOR = require('../simulator/scenarios/demonstrateIDOR');

// OWASP vulnerability definitions with metadata
const VULN_MODULES = [
    {
        id: 'A03',
        name: 'Reflected XSS',
        owaspId: 'A03:2021',
        owaspName: 'Injection',
        severity: 'High',
        cwe: 'CWE-79',
        description: 'User-supplied data is reflected in the page without sanitization, allowing script execution in victims\' browsers.',
        remediation: 'Encode all user output. Use Content-Security-Policy headers. Employ a framework with automatic XSS protection.',
        phase: 'Injection Testing',
        mockUrl: null, // built in scenario
        scenario: (targetUrl) => demonstrateXSS(null, null),
        delayMs: 2000,
    },
    {
        id: 'A07',
        name: 'Broken Authentication (SQLi Bypass)',
        owaspId: 'A07:2021',
        owaspName: 'Identification & Authentication Failures',
        severity: 'Critical',
        cwe: 'CWE-89',
        description: 'Login form is vulnerable to SQL injection. Attacker bypasses authentication using payloads like `admin\' OR \'1\'=\'1\'`.',
        remediation: 'Use parameterized queries / prepared statements. Enforce MFA. Implement account lockout after failed attempts.',
        phase: 'Authentication Testing',
        scenario: (targetUrl) => demonstrateAuthBypass(),
        delayMs: 3000,
    },
    {
        id: 'A01',
        name: 'Insecure Direct Object Reference (IDOR)',
        owaspId: 'A01:2021',
        owaspName: 'Broken Access Control',
        severity: 'High',
        cwe: 'CWE-639',
        description: 'API endpoint exposes sequential IDs allowing any user to access another user\'s private data by incrementing the ID.',
        remediation: 'Use indirect references (UUIDs). Enforce server-side authorization checks on every request.',
        phase: 'Access Control Testing',
        scenario: (targetUrl) => demonstrateIDOR(),
        delayMs: 2500,
    },
];

class ScannerEngine {
    /**
     * Runs the full simulated scan pipeline, emitting WS events for each phase.
     * @param {Object} opts - { scanId, targetUrl, io, scanStore }
     */
    async runScan({ scanId, targetUrl, io, scanStore }) {
        const emit = (event, data) => io.emit(event, { scanId, ...data });
        const scan = scanStore[scanId];

        // ── Phase 1: Crawling ──────────────────────────────────────────────
        scan.status = 'crawling';
        emit('scan:progress', {
            phase: 'crawling',
            message: 'Spider crawling application surface...',
            progress: 10,
        });
        console.log(`[Engine:${scanId}] Crawling ${targetUrl}`);
        await delay(2000);

        const vectorCount = Math.floor(Math.random() * 15) + 8;
        emit('scan:progress', {
            phase: 'crawling',
            message: `Crawl complete. Found ${vectorCount} input vectors across ${Math.floor(vectorCount / 3)} pages.`,
            progress: 30,
        });
        await delay(800);

        // ── Phase 2: Injection Testing ────────────────────────────────────
        scan.status = 'scanning';
        for (let i = 0; i < VULN_MODULES.length; i++) {
            const mod = VULN_MODULES[i];
            const progressBase = 30 + (i / VULN_MODULES.length) * 45;

            emit('scan:progress', {
                phase: 'scanning',
                message: `[${mod.owaspId}] ${mod.phase} — injecting payloads...`,
                progress: Math.round(progressBase),
            });
            console.log(`[Engine:${scanId}] Running module: ${mod.name}`);
            await delay(mod.delayMs);

            // ── Phase 3: Visual Simulation ────────────────────────────────
            emit('scan:progress', {
                phase: 'simulating',
                message: `🎬 Vulnerability confirmed! Recording visual proof for: ${mod.name}`,
                progress: Math.round(progressBase + 10),
            });

            const scenario = mod.scenario(targetUrl);
            const simResult = await simulator.recordScenario(scenario);

            const finding = {
                id: `${scanId}-${mod.id}`,
                vulnerability: mod.name,
                owaspId: mod.owaspId,
                owaspName: mod.owaspName,
                severity: mod.severity,
                cwe: mod.cwe,
                description: mod.description,
                remediation: mod.remediation,
                url: targetUrl,
                evidence: simResult,
                timestamp: new Date().toISOString(),
            };

            scan.findings.push(finding);

            // Emit individual finding in real-time
            emit('scan:finding', { finding });
        }

        // ── Phase 4: Done ─────────────────────────────────────────────────
        scan.status = 'done';
        scan.completedAt = new Date().toISOString();
        emit('scan:progress', {
            phase: 'done',
            message: `Scan complete. Found ${scan.findings.length} vulnerabilities.`,
            progress: 100,
        });
        emit('scan:complete', { scan });

        console.log(`[Engine:${scanId}] Scan complete. ${scan.findings.length} findings.`);
        return scan;
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = new ScannerEngine();
