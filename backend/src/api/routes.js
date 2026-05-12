const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ScannerEngine = require('../scanner/engine');

// In-memory scan store: scanId -> { status, findings, startedAt }
const scanStore = {};

// GET all reports
router.get('/reports', (req, res) => {
    const all = Object.values(scanStore);
    res.json(all);
});

// GET a single scan
router.get('/reports/:scanId', (req, res) => {
    const scan = scanStore[req.params.scanId];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
});

// POST - initiate a new scan
router.post('/scan', async (req, res) => {
    const { targetUrl } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required' });
    }

    const scanId = uuidv4();
    const io = req.app.locals.io;

    // Seed the store immediately
    scanStore[scanId] = {
        scanId,
        targetUrl,
        status: 'queued',
        findings: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
    };

    console.log(`[API] Scan queued: ${scanId} → ${targetUrl}`);

    // Fire and forget: run in background, emit progress over WS
    ScannerEngine.runScan({ scanId, targetUrl, io, scanStore }).catch((err) => {
        console.error(`[Engine] Unhandled error for scan ${scanId}:`, err);
        scanStore[scanId].status = 'error';
        io.emit('scan:error', { scanId, message: err.message });
    });

    res.json({ scanId, status: 'queued', targetUrl });
});

module.exports = router;
