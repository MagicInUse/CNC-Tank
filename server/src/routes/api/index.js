import express from 'express';
import controlRouter from './control/index.js';
import statusRouter from './status/index.js';
import updateRouter from './update/index.js';
import configRouter from './config/index.js';

const apiRouter = express.Router();

// /api/

apiRouter.use('/config', configRouter);
apiRouter.use('/control', controlRouter);
apiRouter.use('/status', statusRouter);
apiRouter.use('/update', updateRouter);

export default apiRouter;