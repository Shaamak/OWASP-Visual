/**
 * Demonstrates an SQLi-based Authentication Bypass attack.
 * The simulator types the malicious payload into a mock login form and
 * records the browser being redirected to the "admin dashboard".
 */
const demonstrateAuthBypass = () => {
    return async (page) => {
        // Build a self-contained login page in HTML
        const loginHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Login — TargetApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #16213e; border: 1px solid #0f3460; border-radius: 12px; padding: 2.5rem; width: 380px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    h2 { color: #e0e0e0; margin-bottom: 1.5rem; text-align: center; }
    label { color: #a0a0b0; font-size: 0.85rem; display: block; margin-bottom: 0.3rem; }
    input { width: 100%; padding: 0.7rem 1rem; border-radius: 6px; border: 1px solid #0f3460; background: #0d1b2a; color: #e0e0e0; font-size: 1rem; margin-bottom: 1.2rem; }
    button { width: 100%; padding: 0.8rem; border-radius: 6px; border: none; background: #e94560; color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .msg { color: #ff6b6b; text-align: center; margin-top: 1rem; font-size: 0.9rem; display:none; }
    #dashboard { display:none; background:#0d1b2a; border-radius:8px; padding:2rem; margin-top:1rem; color:#4ecca3; }
    #dashboard h3 { margin-bottom:0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🔐 Admin Login</h2>
    <label>Username</label>
    <input id="username" type="text" placeholder="Enter username" />
    <label>Password</label>
    <input id="password" type="password" placeholder="Enter password" />
    <button onclick="doLogin()">Sign In</button>
    <p class="msg" id="error-msg">❌ Invalid credentials</p>
    <div id="dashboard">
      <h3>✅ Admin Dashboard — Access Granted!</h3>
      <p>Welcome, admin. You are now viewing sensitive data.</p>
      <ul style="margin-top:0.5rem; padding-left:1rem; color:#a0ffc8;">
        <li>User records: 15,234</li>
        <li>Revenue (Q1): $2,847,000</li>
        <li>API Keys: [REDACTED]</li>
      </ul>
    </div>
  </div>
  <script>
    function doLogin() {
      const u = document.getElementById('username').value;
      // Vulnerable: checks for SQLi pattern to simulate bypass
      if (u.includes("'") || u.toLowerCase().includes('or')) {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('error-msg').style.display = 'none';
      } else {
        document.getElementById('error-msg').style.display = 'block';
      }
    }
  </script>
</body>
</html>`;

        await page.goto(`data:text/html,${encodeURIComponent(loginHtml)}`);
        await page.waitForTimeout(1200);

        // Type the SQLi payload character by character for visual effect
        const usernameInput = page.locator('#username');
        await usernameInput.click();
        await page.waitForTimeout(400);

        const payload = "admin' OR '1'='1";
        for (const char of payload) {
            await usernameInput.type(char);
            await page.waitForTimeout(80);
        }

        await page.waitForTimeout(600);

        const passInput = page.locator('#password');
        await passInput.click();
        await passInput.type('anything');
        await page.waitForTimeout(500);

        // Click login — page will reveal admin dashboard
        await page.locator('button').click();
        await page.waitForTimeout(2500);
    };
};

module.exports = demonstrateAuthBypass;
