/**
 * Demonstrates a Reflected XSS attack with a rich, realistic-looking page.
 */
const demonstrateXSS = (url, payload) => {
    return async (page) => {
        // Build a realistic-looking search results page with the XSS payload embedded
        const xssHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Search — TargetApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .navbar { background: #1e3a5f; padding: 0.8rem 2rem; display:flex; align-items:center; gap:1rem; }
    .navbar .logo { color: #fff; font-weight: 700; font-size: 1.2rem; }
    .search-bar { flex:1; display:flex; gap:0.5rem; }
    .search-bar input { flex:1; padding: 0.4rem 0.8rem; border-radius:4px; border:none; }
    .search-bar button { background:#e94560; color:#fff; border:none; padding:0.4rem 1rem; border-radius:4px; cursor:pointer; }
    .content { padding: 2rem; max-width: 800px; }
    .result-info { color: #64748b; margin-bottom:1.5rem; font-size:0.9rem; }
    .result-info .query { color: #e94560; font-weight: 600; }
    .result { border-bottom: 1px solid #e2e8f0; padding: 1rem 0; }
    .result h3 { color: #1e3a5f; margin-bottom:0.3rem; }
    .result p { color: #64748b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="logo">TargetApp</div>
    <div class="search-bar">
      <input type="text" value="<script>alert('XSS')</script>" />
      <button>Search</button>
    </div>
  </nav>
  <div class="content">
    <p class="result-info">Showing results for: <span class="query" id="reflected-query"></span></p>
    <div class="result"><h3>Result 1 - Lorem Ipsum Page</h3><p>Some description of a result here...</p></div>
    <div class="result"><h3>Result 2 - Example Resource</h3><p>Another search result description...</p></div>
  </div>
  <script>
    // VULNERABLE: reflects raw user input into the DOM
    const params = new URLSearchParams('q=' + encodeURIComponent("<img src=x onerror=alert('XSS by Aevus Scanner!')>"));
    document.getElementById('reflected-query').innerHTML = decodeURIComponent(params.get('q'));
  </script>
</body>
</html>`;

        // Catch the dialog before navigating
        page.on('dialog', async (dialog) => {
            console.log(`[Scenario: XSS] Dialog caught: "${dialog.message()}"`);
            await page.waitForTimeout(2000); // Hold for recording
            await dialog.accept();
        });

        const target = url || `data:text/html,${encodeURIComponent(xssHtml)}`;
        await page.goto(target);
        await page.waitForTimeout(3000);
    };
};

module.exports = demonstrateXSS;
