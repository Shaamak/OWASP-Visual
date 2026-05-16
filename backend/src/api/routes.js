const express = require('express');
const router  = express.Router();
const { randomUUID } = require('crypto');
const ScannerEngine  = require('../scanner/engine');
const { generatePdfReport } = require('./pdfReport');
const { loadIntoStore, flush } = require('../db/persistence');

// ── In-memory scan store (seeded from disk on startup) ────────────────────
const scanStore = {};
loadIntoStore(scanStore);

// ── GET all scan history (sorted newest first) ────────────────────────────
router.get('/history', (req, res) => {
    const all = Object.values(scanStore)
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    res.json(all);
});

// ── GET single scan (all findings) ───────────────────────────────────────
router.get('/history/:scanId', (req, res) => {
    const scan = scanStore[req.params.scanId];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
});

// ── Legacy aliases ────────────────────────────────────────────────────────
router.get('/reports', (req, res) => {
    res.json(Object.values(scanStore));
});

router.get('/reports/:scanId', (req, res) => {
    const scan = scanStore[req.params.scanId];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
});

// ── POST — initiate a new scan ────────────────────────────────────────────
router.post('/scan', async (req, res) => {
    const { targetUrl, selectedModules } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required' });
    }

    const scanId = randomUUID();
    const io     = req.app.locals.io;

    scanStore[scanId] = {
        scanId,
        targetUrl,
        selectedModules: selectedModules || [],
        status:      'queued',
        findings:    [],
        startedAt:   new Date().toISOString(),
        completedAt: null,
    };

    console.log(`[API] Scan queued: ${scanId} -> ${targetUrl}`);

    ScannerEngine.runScan({ scanId, targetUrl, io, scanStore, selectedModules })
        .then(() => flush(scanStore))               // persist to disk on success
        .catch((err) => {
            console.error(`[Engine] Unhandled error for scan ${scanId}:`, err);
            scanStore[scanId].status = 'error';
            io.emit('scan:error', { scanId, message: err.message });
            flush(scanStore);                        // also persist errors
        });

    res.json({ scanId, status: 'queued', targetUrl });
});

// ── GET PDF for a completed scan ──────────────────────────────────────────
router.get('/reports/:scanId/pdf', (req, res) => {
    const scan = scanStore[req.params.scanId];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    if (scan.status !== 'done') {
        return res.status(400).json({ error: 'Scan is not complete yet.' });
    }
    try {
        generatePdfReport(scan, res);
    } catch (err) {
        console.error('[PDF] Generation failed:', err);
        res.status(500).json({ error: 'PDF generation failed' });
    }
});

module.exports = router;
