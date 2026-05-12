/**
 * A08:2021 – Software and Data Integrity Failures (CSRF)
 * Demonstrates a Cross-Site Request Forgery attack where an attacker's
 * page silently makes a state-changing request on behalf of a logged-in user.
 */
const demonstrateCSRF = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Attacker's Page — CSRF Demo</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    .split { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:1.5rem; }
    .panel { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.25rem; }
    .panel-title { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:1rem; }
    .panel-title.red { color:#f87171; }
    .panel-title.blue { color:#60a5fa; }
    .attacker-page { background:#1a0a0a; border:2px solid #7f1d1d; border-radius:6px; padding:1rem; font-size:0.8rem; }
    .attacker-page h3 { color:#f87171; margin-bottom:0.5rem; }
    .attacker-page p { color:#94a3b8; font-size:0.8rem; }
    .hidden-form { background:#2a0a0a; border:1px dashed #ef4444; border-radius:4px; padding:0.75rem; margin-top:0.75rem; font-family:monospace; font-size:0.72rem; color:#fca5a5; line-height:1.7; }
    .log { font-family:monospace; font-size:0.78rem; line-height:1.8; }
    .log-entry { padding:0.2rem 0; border-bottom:1px solid #1a1a2e; }
    .log-entry.danger { color:#f87171; }
    .log-entry.info { color:#60a5fa; }
    .log-entry.success { color:#4ade80; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
    h1 { color:#f87171; font-size:1.2rem; margin-bottom:0.5rem; }
    .timeline { margin-top:0; }
    .step { display:flex; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid #1a1a2e; }
    .step-num { width:22px; height:22px; border-radius:50%; background:#7f1d1d; color:#fca5a5; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; flex-shrink:0; }
    .step-text { font-size:0.8rem; color:#cbd5e1; }
  </style>
</head>
<body>
  <h1>🎭 CSRF Attack in Progress</h1>
  <div class="alert">⚠️ A08:2021 — CSRF: Victim visits attacker's site. A hidden form auto-submits to bank.com/transfer, moving funds with the victim's active session — no interaction required.</div>

  <div class="split">
    <div class="panel">
      <div class="panel-title red">🔴 Attacker's Malicious Page (evil.com)</div>
      <div class="attacker-page">
        <h3>🎉 You won a $1000 prize!</h3>
        <p>Click below to claim your reward...</p>
        <div class="hidden-form">
          &lt;!-- Hidden, auto-submitting form --&gt;<br>
          &lt;form action="https://bank.com/transfer"<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method="POST" id="csrf"&gt;<br>
          &nbsp;&nbsp;&lt;input name="to" value="attacker_acct" /&gt;<br>
          &nbsp;&nbsp;&lt;input name="amount" value="5000" /&gt;<br>
          &nbsp;&nbsp;&lt;input name="currency" value="USD" /&gt;<br>
          &lt;/form&gt;<br>
          &lt;script&gt;document.getElementById('csrf').submit()&lt;/script&gt;
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title blue">📋 Attack Timeline</div>
      <div class="timeline">
        <div class="step"><div class="step-num">1</div><div class="step-text">Victim logs into bank.com — session cookie set: <code style="color:#fbbf24">session=eyJhbGci...</code></div></div>
        <div class="step"><div class="step-num">2</div><div class="step-text">Victim clicks phishing link → lands on evil.com</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-text">Hidden form auto-submits POST to bank.com/transfer in the background</div></div>
        <div class="step"><div class="step-num">4</div><div class="step-text">Browser automatically includes victim's session cookie in the forged request</div></div>
        <div class="step"><div class="step-num">5</div><div class="step-text" style="color:#f87171"><strong>$5,000 transferred to attacker. No CSRF token was validated.</strong></div></div>
      </div>
    </div>
  </div>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(4000);
    };
};

module.exports = demonstrateCSRF;
