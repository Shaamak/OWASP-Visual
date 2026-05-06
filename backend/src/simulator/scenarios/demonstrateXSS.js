/**
 * Demonstrates a Reflected XSS attack.
 * 
 * @param {string} url - The vulnerable URL
 * @param {string} payload - The injected payload
 * @returns {Function} A scenario function to be executed by the Simulator
 */
const demonstrateXSS = (url, payload) => {
    return async (page) => {
        // 1. Setup event listener to catch the alert dialog
        page.on('dialog', async dialog => {
            console.log(`[Scenario: XSS] Dialog caught with message: "${dialog.message()}"`);
            
            // Wait a moment so the video captures the dialog box before we dismiss it
            await page.waitForTimeout(1500); 
            
            await dialog.accept();
        });

        // 2. Navigate to the URL containing the payload
        // E.g., http://target.com/search?q=<script>alert('XSS')</script>
        console.log(`[Scenario: XSS] Navigating to target URL...`);
        
        // Use a generic mock URL for testing if none provided
        const target = url || `data:text/html,<h1>XSS Test</h1><script>alert('${payload || 'Simulated XSS!'}')</script>`;
        
        await page.goto(target);

        // Wait for network idle or a specific element to ensure page loaded
        await page.waitForTimeout(2000); 
    };
};

module.exports = demonstrateXSS;
