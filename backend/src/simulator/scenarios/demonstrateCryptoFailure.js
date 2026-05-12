/**
 * A02:2021 – Cryptographic Failures
 * Shows sensitive data (passwords, credit cards) exposed in plaintext
 * over an unencrypted HTTP connection and in API responses.
 */
const demonstrateCryptoFailure = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>API Response — TargetApp</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    .topbar { display:flex; align-items:center; gap:1rem; background:#1a1a2e; padding:0.8rem 1.5rem; border-radius:8px; margin-bottom:1.5rem; }
    .http-badge { background:#ef4444; color:#fff; padding:0.2rem 0.6rem; border-radius:4px; font-weight:700; font-size:0.8rem; }
    .url { font-family:monospace; font-size:0.85rem; color:#94a3b8; }
    h2 { margin-bottom:1rem; font-size:1rem; color:#f1f5f9; }
    pre { background:#1e1e2e; border:1px solid #2d2d3a; border-radius:8px; padding:1.5rem; font-family:monospace; font-size:0.8rem; line-height:1.7; overflow:auto; }
    .key { color:#7dd3fc; }
    .val { color:#86efac; }
    .val.sensitive { color:#f87171; background:rgba(248,113,113,0.1); padding:0 3px; border-radius:3px; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.85rem; }
    .alert strong { display:block; margin-bottom:0.3rem; }
  </style>
</head>
<body>
  <div class="topbar">
    <span class="http-badge">HTTP</span>
    <span class="url">http://targetapp.com/api/users/profile  ← No HTTPS!</span>
  </div>
  <div class="alert">
    <strong>⚠️ A02:2021 — Cryptographic Failure Detected</strong>
    Sensitive data transmitted over unencrypted HTTP. API response leaks plaintext passwords, PII, and credit card numbers.
  </div>
  <h2>🔓 API Response: GET /api/users/42</h2>
  <pre id="output"></pre>
  <script>
    const data = {
      id: 42,
      username: "john.doe",
      email: "john.doe@company.com",
      password: "Summer2024!",
      password_hash: "md5:5f4dcc3b5aa765d61d8327deb882cf99",
      credit_card: "4111-1111-1111-1111",
      cvv: "737",
      ssn: "123-45-6789",
      dob: "1988-04-12",
      api_key: "sk_live_a9f3k2m8x0p1q7r4",
      role: "admin"
    };
    const sensitive = ["password","password_hash","credit_card","cvv","ssn","api_key"];
    let html = '{\n';
    for (const [k, v] of Object.entries(data)) {
      const isSensitive = sensitive.includes(k);
      html += '  <span class="key">"' + k + '"</span>: <span class="val' + (isSensitive?' sensitive':'') + '">"' + v + '"</span>,\n';
    }
    html += '}';
    document.getElementById('output').innerHTML = html;
  </script>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(4000);
    };
};

module.exports = demonstrateCryptoFailure;
