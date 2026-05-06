const express = require('express');
const router = express.Router();
const ScannerEngine = require('../scanner/engine');

// Mock database for now
const reports = [];

router.post('/scan', async (req, res) => {
    const { targetUrl } = req.body;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required' });
    }

    try {
        console.log(`[API] Initiating scan for: ${targetUrl}`);
        
        // Start the scanner engine asynchronously
        // In a real app, this would be a background job (e.g., BullMQ)
        ScannerEngine.runScan(targetUrl)
            .then(result => {
                reports.push(result);
                console.log(`[API] Scan completed for ${targetUrl}`);
            })
            .catch(err => {
                console.error(`[API] Scan failed:`, err);
            });

        // Immediately return a tracking ID
        res.json({ 
            message: 'Scan initiated', 
            status: 'running',
            targetUrl 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reports', (req, res) => {
    res.json(reports);
});

module.exports = router;
