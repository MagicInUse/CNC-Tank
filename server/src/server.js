import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

const BASE_URL = 'http://10.0.0.51';
const PORT = 3001;

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  };
  
app.use(cors(corsOptions));
app.use(express.json());

// Endpoint to get data from ESP32
app.get('/api/test-data', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/test-data`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error connecting to ESP32');
    }
});

// Endpoint to send commands to ESP32
app.post('/api/control', async (req, res) => {
    const { command } = req.body;

    if (!command || !command.axis || !command.direction || !command.speed || !command.step) {
        return res.status(400).json({ error: 'Missing required command parameters' });
    }

    try {
        const response = await axios.post(`${BASE_URL}/api/control`, { command });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));