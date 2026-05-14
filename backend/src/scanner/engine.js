const simulator = require('../simulator/browser');

// ── All 10 scenario imports ────────────────────────────────────────────────
const demonstrateXSS                = require('../simulator/scenarios/demonstrateXSS');
const demonstrateAuthBypass         = require('../simulator/scenarios/demonstrateAuthBypass');
const demonstrateIDOR               = require('../simulator/scenarios/demonstrateIDOR');
const demonstrateCryptoFailure      = require('../simulator/scenarios/demonstrateCryptoFailure');
const demonstrateInsecureDesign     = require('../simulator/scenarios/demonstrateInsecureDesign');
const demonstrateSecurityMisconfig  = require('../simulator/scenarios/demonstrateSecurityMisconfig');
const demonstrateVulnerableComponents = require('../simulator/scenarios/demonstrateVulnerableComponents');
const demonstrateCSRF               = require('../simulator/scenarios/demonstrateCSRF');
const demonstrateLoggingFailure     = require('../simulator/scenarios/demonstrateLoggingFailure');
const demonstrateSSRF               = require('../simulator/scenarios/demonstrateSSRF');

// ── OWASP Top 10 Module Definitions ──────────────────────────────────────
const VULN_MODULES = [
    {
        owaspId: 'A01:2021',
        owaspName: 'Broken Access Control',
        name: 'Insecure Direct Object Reference (IDOR)',
        severity: 'High',
        cwe: 'CWE-639',
        description: 'API endpoint exposes sequential user IDs, allowing any authenticated user to access another user\'s private data by simply incrementing the ID parameter.',
        remediation: 'Use indirect references (UUIDs). Enforce server-side authorization checks on every request. Never trust client-provided resource IDs without ownership verification.',
        phase: 'Access Control Testing',
        delayMs: 1500,
        scenario: () => demonstrateIDOR(),
    },
    {
        owaspId: 'A02:2021',
        owaspName: 'Cryptographic Failures',
        name: 'Sensitive Data Exposure (Plaintext)',
        severity: 'Critical',
        cwe: 'CWE-312',
        description: 'API transmits passwords, credit card numbers, and PII over unencrypted HTTP. Sensitive fields are stored and returned as plaintext in API responses.',
        remediation: 'Enforce HTTPS everywhere with HSTS. Hash passwords with bcrypt/Argon2. Encrypt PII at rest. Never return sensitive fields in API responses.',
        phase: 'Cryptographic Testing',
        delayMs: 1500,
        scenario: () => demonstrateCryptoFailure(),
    },
    {
        owaspId: 'A03:2021',
        owaspName: 'Injection',
        name: 'Reflected Cross-Site Scripting (XSS)',
        severity: 'High',
        cwe: 'CWE-79',
        description: 'User-supplied search query is reflected in the HTML page without sanitization. An attacker can craft a URL that executes arbitrary JavaScript in a victim\'s browser.',
        remediation: 'Encode all user output with context-aware escaping. Implement Content-Security-Policy headers. Use a framework with automatic XSS protection.',
        phase: 'Injection Testing',
        delayMs: 1500,
        scenario: () => demonstrateXSS(null, null),
    },
    {
        owaspId: 'A04:2021',
        owaspName: 'Insecure Design',
        name: 'Password Reset OTP Brute Force',
        severity: 'High',
        cwe: 'CWE-307',
        description: 'The password reset flow uses a 4-digit numeric OTP (10,000 combinations) with no rate limiting, lockout, or expiry. An attacker can cycle all possibilities in under 60 seconds.',
        remediation: 'Use cryptographically random, long tokens. Enforce rate limiting (3–5 attempts). Expire OTPs after 5 minutes. Lock the account after failures.',
        phase: 'Business Logic Testing',
        delayMs: 2000,
        scenario: () => demonstrateInsecureDesign(),
    },
    {
        owaspId: 'A05:2021',
        owaspName: 'Security Misconfiguration',
        name: 'Debug Endpoint Exposed in Production',
        severity: 'Critical',
        cwe: 'CWE-16',
        description: 'A debug endpoint is publicly accessible with no authentication, exposing environment variables including database passwords, JWT secrets, and AWS access keys. Directory listing is also enabled.',
        remediation: 'Disable debug endpoints in production. Use environment-specific configs. Scan for exposed endpoints regularly. Rotate any exposed secrets immediately.',
        phase: 'Configuration Testing',
        delayMs: 1500,
        scenario: () => demonstrateSecurityMisconfig(),
    },
    {
        owaspId: 'A06:2021',
        owaspName: 'Vulnerable & Outdated Components',
        name: 'Log4Shell RCE (CVE-2021-44228)',
        severity: 'Critical',
        cwe: 'CWE-1104',
        description: 'Application uses Log4j 2.14.1 which is vulnerable to JNDI injection. A single malicious User-Agent header triggers a callback to an attacker-controlled LDAP server, resulting in full Remote Code Execution.',
        remediation: 'Update Log4j to 2.17.1+. Use a dependency scanner (OWASP Dependency-Check, Snyk). Establish a process to patch CVEs within 48h of disclosure.',
        phase: 'Component Analysis',
        delayMs: 1500,
        scenario: () => demonstrateVulnerableComponents(),
    },
    {
        owaspId: 'A07:2021',
        owaspName: 'Identification & Authentication Failures',
        name: 'SQL Injection — Authentication Bypass',
        severity: 'Critical',
        cwe: 'CWE-89',
        description: 'The login form concatenates user input directly into SQL queries. The payload `admin\' OR \'1\'=\'1` bypasses authentication and grants admin access without any valid credentials.',
        remediation: 'Use parameterized queries / prepared statements exclusively. Enforce MFA on admin accounts. Implement account lockout policies after failed login attempts.',
        phase: 'Authentication Testing',
        delayMs: 2000,
        scenario: () => demonstrateAuthBypass(),
    },
    {
        owaspId: 'A08:2021',
        owaspName: 'Software & Data Integrity Failures',
        name: 'Cross-Site Request Forgery (CSRF)',
        severity: 'High',
        cwe: 'CWE-352',
        description: 'State-changing endpoints lack CSRF token validation. A malicious page can silently submit forged requests using the victim\'s active session cookies, performing unauthorized actions on their behalf.',
        remediation: 'Implement synchronizer token pattern (CSRF tokens). Use SameSite=Strict/Lax cookie attribute. Verify Origin and Referer headers on all state-changing requests.',
        phase: 'Integrity Testing',
        delayMs: 1500,
        scenario: () => demonstrateCSRF(),
    },
    {
        owaspId: 'A09:2021',
        owaspName: 'Security Logging & Monitoring Failures',
        name: 'Undetected Credential Brute Force',
        severity: 'Medium',
        cwe: 'CWE-778',
        description: '847 failed login attempts from a single IP address over 3 minutes went completely undetected. No alerts were triggered, allowing the attacker to crack credentials and exfiltrate 2.1M user records undetected for 72 hours.',
        remediation: 'Log all authentication events. Set up real-time alerts for >10 failures/minute per IP. Integrate with a SIEM. Implement anomaly detection for unusual access patterns.',
        phase: 'Logging & Monitoring',
        delayMs: 2500,
        scenario: () => demonstrateLoggingFailure(),
    },
    {
        owaspId: 'A10:2021',
        owaspName: 'Server-Side Request Forgery (SSRF)',
        name: 'SSRF — AWS Metadata Credential Theft',
        severity: 'Critical',
        cwe: 'CWE-918',
        description: 'The URL preview feature accepts arbitrary URLs without validation. An attacker supplies the AWS EC2 metadata endpoint URL, causing the server to fetch and return the instance\'s IAM credentials, granting full AWS account access.',
        remediation: 'Validate and allowlist URLs strictly. Block requests to private/metadata IP ranges (169.254.x.x, 10.x, 172.16.x, 192.168.x). Use a network egress firewall. Disable IMDSv1 on EC2.',
        phase: 'SSRF Testing',
        delayMs: 1500,
        scenario: () => demonstrateSSRF(),
    },
];

// ── Engine ────────────────────────────────────────────────────────────────
class ScannerEngine {
    async runScan({ scanId, targetUrl, io, scanStore, selectedModules }) {
        const emit = (event, data) => io.emit(event, { scanId, ...data });
        const scan = scanStore[scanId];

        // ── Phase 1: Crawling ───────────────────────────────────────────
        scan.status = 'crawling';
        emit('scan:progress', {
            phase: 'crawling',
            message: `Spider crawling application surface at ${targetUrl} ...`,
            progress: 5,
        });
        await delay(1800);

        const vectorCount = Math.floor(Math.random() * 15) + 10;
        emit('scan:progress', {
            phase: 'crawling',
            message: `Crawl complete. Found ${vectorCount} input vectors across ${Math.ceil(vectorCount / 3)} pages.`,
            progress: 12,
        });
        await delay(600);

        // ── Phase 2–4: Run each OWASP module ──────────────────────────
        // Filter to only selected modules (default: all)
        const activeModules = (selectedModules && selectedModules.length > 0)
            ? VULN_MODULES.filter(m => selectedModules.includes(m.owaspId))
            : VULN_MODULES;

        const totalModules = activeModules.length;
        for (let i = 0; i < activeModules.length; i++) {
            const mod = activeModules[i];
            const progressBase = 12 + Math.round((i / totalModules) * 75);

            // Scanning phase
            scan.status = 'scanning';
            emit('scan:progress', {
                phase: 'scanning',
                message: `[${mod.owaspId}] ${mod.phase} — injecting payloads...`,
                progress: progressBase,
            });
            console.log(`[Engine:${scanId}] Module ${i + 1}/${totalModules}: ${mod.name}`);
            await delay(mod.delayMs);

            // Simulation phase
            emit('scan:progress', {
                phase: 'simulating',
                message: `[${mod.owaspId}] Vulnerability confirmed. Recording visual proof...`,
                progress: progressBase + 5,
            });

            const simResult = await simulator.recordScenario(mod.scenario());

            const finding = {
                id: `${scanId}-${mod.owaspId.replace(':', '')}`,
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
            emit('scan:finding', { finding });
        }

        // ── Done ───────────────────────────────────────────────────────
        scan.status = 'done';
        scan.completedAt = new Date().toISOString();

        const criticalCount = scan.findings.filter(f => f.severity === 'Critical').length;
        emit('scan:progress', {
            phase: 'done',
            message: `Scan complete — ${scan.findings.length} vulnerabilities found (${criticalCount} Critical). All exploits recorded.`,
            progress: 100,
        });
        emit('scan:complete', { scan });

        console.log(`[Engine:${scanId}] Done — ${scan.findings.length} findings.`);
        return scan;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = new ScannerEngine();
