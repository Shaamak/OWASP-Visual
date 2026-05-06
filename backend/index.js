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

app.listen(PORT, () => {
    console.log(`[Backend] Scanner API running on http://localhost:${PORT}`);
    console.log(`[Backend] Ready to execute visual exploit simulations.`);
});
