import c from 'kleur';
import express from 'express';
import compression from 'compression';
import path from 'path';
import 'dotenv/config';
import config from './config.js';
import auth from './middlewares/auth.js';
import log from './middlewares/log.js';
import home from './middlewares/home.js';
import createBucketRoutes from './functions/createBucketRoutes.js';
const { APP_ROOT, BUCKETS, PORT } = config;

const app = express();
app.set('x-powered-by', false);

app.use(compression());
app.use(log);
app.use('/', createBucketRoutes(BUCKETS));
app.use('/public', express.static(path.resolve(APP_ROOT, './pages/public'), {
  maxAge: '1d',
  etag: true,
}));

app.get('/', auth, home);

app.listen(PORT, '0.0.0.0', () => {
  console.log(c.green(`Starting at http://localhost:${PORT}`));
});