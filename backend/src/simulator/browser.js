const { chromium } = require('playwright');
const path = require('path');
const crypto = require('crypto');

class VisualSimulator {
    constructor() {
        this.browser = null;
        this.mediaDir = path.join(__dirname, '../../data/media');
    }

    async init() {
        if (!this.browser) {
            console.log('[Simulator] Launching Headless Chromium...');
            this.browser = await chromium.launch({
                headless: true, // Run headless in production
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Executes a given scenario function inside a recorded browser context
     * @param {Function} scenarioFn - The function containing the Playwright interactions
     * @returns {Object} result - Contains the path to the recorded video
     */
    async recordScenario(scenarioFn) {
        await this.init();

        const videoId = crypto.randomBytes(8).toString('hex');
        
        // Create a new context with video recording enabled
        const context = await this.browser.newContext({
            recordVideo: {
                dir: this.mediaDir,
                size: { width: 1280, height: 720 }
            }
        });

        const page = await context.newPage();
        
        try {
            console.log(`[Simulator] Starting recording for scenario: ${videoId}`);
            // Execute the specific exploit scenario
            await scenarioFn(page);
            console.log(`[Simulator] Scenario execution completed.`);
        } catch (error) {
            console.error(`[Simulator] Error during scenario execution:`, error);
        } finally {
            // Close context to finalize the video file
            await context.close();
        }

        // Return the path or relative URL to the saved video
        // Note: Playwright generates a random string for the video filename.
        // For simplicity in MVP, we might need to grab the latest file or return the directory.
        // We'll refine this later. For now, returning a mock path.
        return {
            videoId,
            videoPath: `/media/${videoId}.webm`, // Mocked structure, actual file will be in data/media
            status: 'recorded'
        };
    }
}

module.exports = new VisualSimulator();
