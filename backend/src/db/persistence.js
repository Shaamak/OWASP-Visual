/**
 * persistence.js
 * Simple JSON-file persistence layer for completed scans.
 * Keeps the in-memory scanStore as the working cache;
 * flushes to disk whenever a scan is finished.
 */
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE  = path.join(DATA_DIR, 'scans.json');

/** Load all previously completed scans from disk into the in-memory store. */
function loadIntoStore(scanStore) {
    if (!fs.existsSync(DB_FILE)) return;
    try {
        const raw  = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        Object.assign(scanStore, data);
        console.log(`[DB] Loaded ${Object.keys(data).length} past scan(s) from disk.`);
    } catch (e) {
        console.warn('[DB] Could not parse scans.json — starting fresh.', e.message);
    }
}

/** Persist only completed / errored scans to disk. */
function flush(scanStore) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        const snapshot = {};
        for (const [id, scan] of Object.entries(scanStore)) {
            if (scan.status === 'done' || scan.status === 'error') {
                snapshot[id] = scan;
            }
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
        console.log(`[DB] Flushed ${Object.keys(snapshot).length} scan(s) to disk.`);
    } catch (e) {
        console.error('[DB] Failed to write scans.json:', e.message);
    }
}

module.exports = { loadIntoStore, flush };
