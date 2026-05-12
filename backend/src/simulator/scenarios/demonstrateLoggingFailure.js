/**
 * A09:2021 – Security Logging and Monitoring Failures
 * Shows an attacker running a brute-force attack with zero alerts triggered,
 * demonstrating the absence of security event logging.
 */
const demonstrateLoggingFailure = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>A09 - Logging Failure</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    h1 { color:#f87171; font-size:1.2rem; margin-bottom:0.5rem; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
    .panel { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.25rem; }
    .panel-title { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.75rem; }
    .panel-title.red { color:#f87171; }
    .panel-title.gray { color:#6b7280; }
    .log-stream { height:220px; overflow-y:auto; font-family:monospace; font-size:0.72rem; line-height:1.8; }
    .log-atk { color:#f87171; }
    .log-normal { color:#4b5563; }
    .siem { text-align:center; padding:2rem 1rem; }
    .siem-icon { font-size:3rem; margin-bottom:0.75rem; opacity:0.3; }
    .siem-label { color:#4b5563; font-size:0.85rem; }
    .siem-label strong { display:block; font-size:1.1rem; color:#374151; margin-bottom:0.25rem; }
    .counter { font-family:monospace; font-size:2rem; font-weight:800; color:#f87171; }
    .counter-label { font-size:0.75rem; color:#6b7280; }
    .timeline { grid-column:1/-1; }
    .t-row { display:flex; gap:1rem; padding:0.4rem 0; border-bottom:1px solid #1a1a2e; font-size:0.78rem; }
    .t-time { color:#4b5563; font-family:monospace; width:120px; flex-shrink:0; }
    .t-event { color:#94a3b8; }
    .t-event.attack { color:#f87171; }
    .t-status { margin-left:auto; font-size:0.7rem; color:#ef4444; }
  </style>
</head>
<body>
  <h1>🔇 Security Logging & Monitoring Failure</h1>
  <div class="alert">⚠️ A09:2021 — 847 failed login attempts from a single IP over 3 minutes. Zero alerts fired. No logs captured. The attack went completely undetected.</div>
  <div class="grid">
    <div class="panel">
      <div class="panel-title red">🔴 Attack Log (Raw HTTP)</div>
      <div class="log-stream" id="log-stream"></div>
    </div>
    <div class="panel">
      <div class="panel-title gray">🔕 SIEM Alert Dashboard</div>
      <div class="siem">
        <div class="siem-icon">🔔</div>
        <div class="siem-label"><strong>No Alerts Triggered</strong>System is not monitoring for brute-force patterns.</div>
        <br>
        <div class="counter" id="attack-count">0</div>
        <div class="counter-label">malicious requests — all undetected</div>
      </div>
    </div>
    <div class="panel timeline">
      <div class="panel-title red">📋 Attack Timeline (Reconstructed Post-Breach)</div>
      <div class="t-row"><span class="t-time">01:15:03.221</span><span class="t-event attack">847 brute-force attempts begin from 198.51.100.42</span><span class="t-status">NO ALERT</span></div>
      <div class="t-row"><span class="t-time">01:17:44.009</span><span class="t-event attack">Correct password found for admin@targetapp.com</span><span class="t-status">NO ALERT</span></div>
      <div class="t-row"><span class="t-time">01:17:44.892</span><span class="t-event attack">Attacker session token issued, full admin access gained</span><span class="t-status">NO ALERT</span></div>
      <div class="t-row"><span class="t-time">01:19:12.001</span><span class="t-event attack">Database dump initiated: 2.1M user records exfiltrated</span><span class="t-status">NO ALERT</span></div>
      <div class="t-row"><span class="t-time">72h later</span><span class="t-event" style="color:#fbbf24">Breach discovered via 3rd party threat intel feed</span><span class="t-status" style="color:#fbbf24">TOO LATE</span></div>
    </div>
  </div>
  <script>
    const stream = document.getElementById('log-stream');
    const counter = document.getElementById('attack-count');
    let count = 0;
    const passwords = ['123456','password','admin','letmein','qwerty','monkey','dragon','master','summer2024'];
    function addLog() {
      if (count >= 847) return;
      const batch = Math.floor(Math.random() * 8) + 3;
      for (let i = 0; i < batch; i++) {
        const pass = passwords[Math.floor(Math.random()*passwords.length)];
        const div = document.createElement('div');
        div.className = count < 846 ? 'log-atk' : 'log-normal';
        div.textContent = (count < 846)
          ? \`POST /login 401 user=admin pass=\${pass} ip=198.51.100.42\`
          : \`POST /login 200 user=admin pass=Winter2024! — SESSION GRANTED\`;
        stream.appendChild(div);
        stream.scrollTop = stream.scrollHeight;
        count++;
      }
      counter.textContent = count;
      if (count < 847) setTimeout(addLog, 120);
    }
    setTimeout(addLog, 400);
  </script>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(7000);
    };
};

module.exports = demonstrateLoggingFailure;
