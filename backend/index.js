require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Expose io to routes via app.locals
app.locals.io = io;

// Main API routes
const apiRoutes = require('./src/api/routes');
app.use('/api', apiRoutes);

// Serve recorded simulation videos statically
app.use('/media', express.static(path.join(__dirname, 'data/media')));

io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`[Backend] Scanner API + WebSocket running on http://localhost:${PORT}`);
    console.log(`[Backend] Ready to execute visual exploit simulations.`);
});
