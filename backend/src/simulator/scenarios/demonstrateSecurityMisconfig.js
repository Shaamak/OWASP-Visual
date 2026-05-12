/**
 * A05:2021 – Security Misconfiguration
 * Shows a misconfigured server exposing a debug endpoint, stack traces,
 * directory listing, and default credentials still enabled.
 */
const demonstrateSecurityMisconfig = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Debug Panel — TargetApp</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    h1 { color:#f87171; margin-bottom:0.5rem; font-size:1.4rem; }
    .subtitle { color:#94a3b8; font-size:0.85rem; margin-bottom:2rem; }
    .section { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.25rem; margin-bottom:1.25rem; }
    .section-title { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#f87171; margin-bottom:0.75rem; }
    .stack { font-family:monospace; font-size:0.75rem; line-height:1.6; color:#94a3b8; }
    .stack .frame { color:#7dd3fc; }
    .env-row { display:flex; gap:1rem; margin-bottom:0.4rem; font-size:0.8rem; }
    .env-key { color:#c084fc; width:200px; flex-shrink:0; font-family:monospace; }
    .env-val { color:#86efac; font-family:monospace; }
    .env-val.danger { color:#f87171; }
    .dir { font-family:monospace; font-size:0.8rem; }
    .dir a { color:#60a5fa; text-decoration:none; display:block; padding:0.2rem 0; }
    .dir a:hover { text-decoration:underline; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
  </style>
</head>
<body>
  <h1>🔧 Server Debug Console</h1>
  <p class="subtitle">http://targetapp.com/debug  — Exposed endpoint, no authentication required</p>
  <div class="alert">⚠️ A05:2021 — Security Misconfiguration: Debug mode is ON in production. Sensitive environment variables and stack traces are publicly exposed.</div>

  <div class="section">
    <div class="section-title">📋 Unhandled Exception — Stack Trace</div>
    <div class="stack">
      TypeError: Cannot read property 'id' of undefined<br>
      <span class="frame">&nbsp;&nbsp;at /app/controllers/UserController.js:142:18</span><br>
      &nbsp;&nbsp;at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)<br>
      &nbsp;&nbsp;at next (/app/node_modules/express/lib/router/route.js:137:13)<br>
      <span class="frame">&nbsp;&nbsp;at Route.dispatch (/app/controllers/UserController.js:88:3)</span><br>
      &nbsp;&nbsp;at /app/node_modules/express/lib/router/route.js:112:3<br>
      <span class="frame">&nbsp;&nbsp;Database: mysql://root:P@ssw0rd@db-prod.internal:3306/users_db</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🌍 Environment Variables</div>
    <div class="env-row"><span class="env-key">NODE_ENV</span><span class="env-val danger">production (DEBUG=true)</span></div>
    <div class="env-row"><span class="env-key">DB_HOST</span><span class="env-val danger">db-prod.internal</span></div>
    <div class="env-row"><span class="env-key">DB_PASSWORD</span><span class="env-val danger">P@ssw0rd</span></div>
    <div class="env-row"><span class="env-key">JWT_SECRET</span><span class="env-val danger">mysupersecretkey123</span></div>
    <div class="env-row"><span class="env-key">AWS_ACCESS_KEY_ID</span><span class="env-val danger">AKIA_MOCK_ACCESS_KEY_ID</span></div>
    <div class="env-row"><span class="env-key">AWS_SECRET_ACCESS_KEY</span><span class="env-val danger">wJalrXUtnFEMI/K7MDENG/bPxRfiCY_MOCK_SECRET</span></div>
    <div class="env-row"><span class="env-key">PORT</span><span class="env-val">3000</span></div>
  </div>

  <div class="section">
    <div class="section-title">📁 Directory Listing — /uploads/</div>
    <div class="dir">
      <a href="#">../</a>
      <a href="#">backup_users_2024.sql (4.2 MB)</a>
      <a href="#">private_keys.zip (18 KB)</a>
      <a href="#">user_export_all.csv (12.7 MB)</a>
      <a href="#">config.bak (3 KB)</a>
    </div>
  </div>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(4000);
    };
};

module.exports = demonstrateSecurityMisconfig;
