/**
 * Demonstrates an IDOR (Insecure Direct Object Reference) attack.
 * Shows an attacker incrementing a user ID in an API URL to access other users' data.
 */
const demonstrateIDOR = () => {
    return async (page) => {
        const idorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Profile — TargetApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f0c29; color: #e0e0e0; padding: 2rem; }
    .topbar { background: #1a1748; padding: 1rem 2rem; border-radius: 8px; margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:center; }
    .topbar span { color: #a78bfa; font-weight: 600; }
    .url-bar { background: #1e1e2e; border: 1px solid #4a4a8a; border-radius: 6px; padding: 0.6rem 1rem; font-family: monospace; font-size: 0.9rem; color: #7ee787; margin-bottom: 1.5rem; }
    .card { background: #1a1748; border: 1px solid #2d2b69; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
    .card h3 { color: #a78bfa; margin-bottom: 0.8rem; }
    .field { display:flex; gap:1rem; margin-bottom:0.5rem; }
    .field label { color: #6b7280; width: 120px; flex-shrink:0; }
    .field span { color: #e0e0e0; }
    .alert { background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius:8px; padding:1rem; color:#fca5a5; margin-bottom:1rem; display:none; }
    .btn { background:#7c3aed; color:#fff; border:none; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; margin-right:0.5rem; font-size:0.85rem; }
  </style>
</head>
<body>
  <div class="topbar">
    <strong>TargetApp Dashboard</strong>
    <span>Logged in as: user123 (ID: 42)</span>
  </div>

  <div class="url-bar" id="urlBar">GET /api/users/42/profile</div>

  <div class="alert" id="alert-box">
    ⚠️ <strong>IDOR Exploit Detected:</strong> Attacker accessed User #41's private profile without authorization!
  </div>

  <div class="card" id="profile-card">
    <h3 id="profile-title">👤 Your Profile (User #42)</h3>
    <div class="field"><label>Name</label><span id="name">John Doe</span></div>
    <div class="field"><label>Email</label><span id="email">john.doe@example.com</span></div>
    <div class="field"><label>Phone</label><span id="phone">+1 (555) 0142</span></div>
    <div class="field"><label>Address</label><span id="address">42 Main St, Springfield</span></div>
    <div class="field"><label>CC Last 4</label><span id="cc">****4242</span></div>
  </div>

  <button class="btn" onclick="attackIDOR()">🔓 Exploit IDOR (Change ID to 41)</button>

  <script>
    function attackIDOR() {
      document.getElementById('urlBar').innerText = 'GET /api/users/41/profile  ← ID manipulated!';
      document.getElementById('urlBar').style.color = '#f87171';
      document.getElementById('alert-box').style.display = 'block';
      document.getElementById('profile-title').innerText = '👤 Victim Profile (User #41) — UNAUTHORIZED ACCESS';
      document.getElementById('profile-title').style.color = '#f87171';
      document.getElementById('name').innerText = 'Alice Smith';
      document.getElementById('email').innerText = 'alice.smith@company.com';
      document.getElementById('phone').innerText = '+1 (555) 0141';
      document.getElementById('address').innerText = '41 Oak Ave, Shelbyville';
      document.getElementById('cc').innerText = '****4141';
    }
  </script>
</body>
</html>`;

        await page.goto(`data:text/html,${encodeURIComponent(idorHtml)}`);
        await page.waitForTimeout(1500);

        // Click the exploit button
        await page.locator('button').click();
        await page.waitForTimeout(2500);
    };
};

module.exports = demonstrateIDOR;
