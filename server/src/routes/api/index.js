import express from 'express';
import controlRouter from './control/index.js';
import statusRouter from './status/index.js';

const router = express.Router();

router.use('/control', controlRouter);
router.use('/status', statusRouter);

export default router;