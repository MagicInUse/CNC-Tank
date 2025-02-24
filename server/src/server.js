import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import router from './routes/index.js';
import bonjour from 'bonjour';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true
}));

app.use('/', router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Set up mDNS
    const bonjourService = bonjour();
    bonjourService.publish({ name: 'cnc-base', type: 'http', port: PORT });
});

export default app;