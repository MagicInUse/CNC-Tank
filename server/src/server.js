import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import router from './routes/index.js';
import bonjour from 'bonjour';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server instance
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};

// Attach socket.io to the HTTP server instance with CORS options
const io = new Server(server, {
    cors: {
        origin: corsOptions.origin,
        methods: corsOptions.methods,
        allowedHeaders: corsOptions.allowedHeaders
    }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true
}));

app.use('/', router);

// Websocket configuration
io.on('connection', (socket) => {
    // console.log('a user connected');
    socket.on('disconnect', () => {
        // console.log('user disconnected');
    });
});

export const sendConsoleMessageToClients = (message) => {
    io.emit('consoleMessage', message);
};

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Set up mDNS
    const bonjourService = bonjour();
    bonjourService.publish({ name: 'cnc-base', type: 'http', port: PORT });
});

export default app;