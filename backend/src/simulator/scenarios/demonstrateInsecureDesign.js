/**
 * A04:2021 – Insecure Design
 * Demonstrates a flawed password reset flow that allows account takeover
 * by brute-forcing a 4-digit numeric OTP with no rate limiting.
 */
const demonstrateInsecureDesign = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Account Takeover via Insecure Design</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    h1 { color:#f87171; font-size:1.2rem; margin-bottom:0.5rem; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
    .panel { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.5rem; margin-bottom:1rem; }
    .panel-title { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#c084fc; margin-bottom:1rem; }
    .otp-form { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
    .otp-input { background:#0f0f1a; border:1px solid #374151; border-radius:6px; color:#e0e0e0; padding:0.5rem; width:80px; font-size:1.1rem; text-align:center; font-family:monospace; }
    .otp-btn { background:#7c3aed; color:#fff; border:none; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-weight:600; }
    .log-box { background:#0d0d0d; border-radius:6px; padding:1rem; font-family:monospace; font-size:0.75rem; line-height:1.7; height:180px; overflow-y:auto; }
    .log-try { color:#6b7280; }
    .log-fail { color:#ef4444; }
    .log-success { color:#4ade80; font-weight:700; }
    .progress-info { font-size:0.8rem; color:#94a3b8; margin-top:0.75rem; }
    #status { color:#fbbf24; font-weight:600; }
  </style>
</head>
<body>
  <h1>🔐 Insecure Design — OTP Brute Force</h1>
  <div class="alert">⚠️ A04:2021 — Insecure Design: Password reset uses a 4-digit OTP (10,000 possibilities) with NO rate limiting. Attacker can brute-force it in seconds.</div>

  <div class="panel">
    <div class="panel-title">🤖 Automated Brute Force Attack on admin@targetapp.com</div>
    <div class="log-box" id="log"></div>
    <div class="progress-info">Attempts: <span id="count">0</span> / 10000 &nbsp;|&nbsp; Status: <span id="status">Starting...</span></div>
  </div>

  <div class="panel" id="success-panel" style="display:none; border-color: rgba(74,222,128,0.4); background:rgba(74,222,128,0.05);">
    <div class="panel-title" style="color:#4ade80">✅ ACCOUNT TAKEN OVER</div>
    <p style="font-size:0.85rem; color:#86efac;">OTP Found: <strong id="found-otp" style="color:#fff; font-family:monospace; font-size:1.1rem;"></strong><br><br>
    Attacker now has full access to admin@targetapp.com. Password reset complete. Session cookie issued.</p>
  </div>

  <script>
    const log = document.getElementById('log');
    const countEl = document.getElementById('count');
    const statusEl = document.getElementById('status');
    const TARGET = Math.floor(Math.random() * 9000) + 500;
    let i = 0;
    statusEl.textContent = 'Brute forcing...';

    function addLog(msg, cls) {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = msg;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    function step() {
      if (i >= TARGET) {
        statusEl.textContent = '✅ OTP Found!';
        statusEl.style.color = '#4ade80';
        addLog('>>> OTP CRACKED: ' + String(TARGET).padStart(4,'0') + ' — Account taken over!', 'log-success');
        document.getElementById('found-otp').textContent = String(TARGET).padStart(4,'0');
        document.getElementById('success-panel').style.display = 'block';
        return;
      }
      const batch = Math.min(50, TARGET - i);
      for (let b = 0; b < batch; b++) {
        if ((i + b) % 200 === 0) {
          addLog('Trying OTPs ' + String(i+b).padStart(4,'0') + '–' + String(i+b+49).padStart(4,'0') + '  → 403 Invalid', 'log-try');
        }
      }
      i += batch;
      countEl.textContent = i;
      setTimeout(step, 40);
    }
    setTimeout(step, 500);
  </script>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(6000);
    };
};

module.exports = demonstrateInsecureDesign;
