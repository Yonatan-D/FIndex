import c from 'kleur';
import express from 'express';
import compression from 'compression';
import 'dotenv/config';
import config from './config.js';
import log from './middlewares/log.js';
import createBucketRoutes from './functions/createBucketRoutes.js';
const { PORT, PREFIX } = config;

const app = express();
app.set('x-powered-by', false);

app.use(compression());
app.use(log);
app.use(PREFIX, createBucketRoutes());

app.listen(PORT, '0.0.0.0', () => {
  console.log(c.green(`Starting at http://localhost:${PORT}${PREFIX}`));
});