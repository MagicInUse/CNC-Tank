import express from 'express';
import axios from 'axios';
import cors from 'cors';
import router from './routes/index.js';

const app = express();
const PORT = 3001;

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};
  
app.use(cors(corsOptions));
app.use(express.json());
app.use('/', router);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));