require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/api/routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', apiRoutes);

// Serve recorded simulation videos statically
const path = require('path');
app.use('/media', express.static(path.join(__dirname, 'data/media')));

app.listen(PORT, () => {
    console.log(`[Backend] Scanner API running on http://localhost:${PORT}`);
    console.log(`[Backend] Ready to execute visual exploit simulations.`);
});
