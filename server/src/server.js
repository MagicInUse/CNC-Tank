import express from 'express';
import axios from 'axios';

const app = express();

const BASE_URL = 'http://192.168.68.117';
const PORT = 3001;

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
    try {
        await axios.post(`${BASE_URL}/api/control`, { command });
        res.send('Command sent');
    } catch (error) {
        res.status(500).send('Error connecting to ESP32');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));