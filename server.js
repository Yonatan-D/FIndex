import c from 'kleur';
import express from 'express';
import serveIndex from 'serve-index';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import 'dotenv/config';
import config from './config.js';
import auth from './middlewares/auth.js';
import log from './middlewares/log.js';
import download from './middlewares/download.js';
import home from './middlewares/home.js';
import template from './functions/template.js';
const { APP_ROOT, BUCKETS, PORT } = config;

const app = express();
app.use(helmet());
app.use(compression());
app.use(log);

console.log(c.yellow('Loading buckets:'));

for (const node of BUCKETS) {
  const routePath = '/' + encodeURIComponent(node.name);
  app.use(routePath, auth, download, express.static(node.path), serveIndex(node.path, {
    icons: true,
    view: 'details',
    // template: path.resolve(APP_ROOT, './pages/directory.html')
    template,
  }));
  console.log(c.yellow(node.name + ': ' + node.path));
}

app.use('/public', express.static(path.resolve(APP_ROOT, './pages/public'), {
  maxAge: '1d',
  etag: true,
}));

app.get('/', auth, home);

app.listen(PORT, '0.0.0.0', () => {
  console.log(c.green(`Starting at http://localhost:${PORT}`));
});