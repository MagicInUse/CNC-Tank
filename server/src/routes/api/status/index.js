import express from 'express';
import { checkStatus } from '../../../controllers/statusController.js';

const statusRouter = express.Router();

// /api/status/
statusRouter.post('/', checkStatus);

export default statusRouter;