import express from 'express';
import serveIndex from 'serve-index';
import path from 'path';
import 'dotenv/config';
import config from './config.js';
import auth from './middlewares/auth.js';
import log from './middlewares/log.js';
import download from './functions/download.js';
import home from './functions/home.js';
import template from './functions/template.js';
const { APP_ROOT, BUCKETS, PORT } = config;

const app = express();
app.use(log);

console.log('Loading buckets:');

for (const node of BUCKETS) {
  app.use(`/${node.name}`, auth, download, express.static(node.path), serveIndex(node.path, {
    icons: true,
    view: 'details',
    // template: path.resolve(APP_ROOT, './pages/directory.html')
    template,
  }));
  console.log(node.name + ': ' + node.path);
}

app.use('/public', express.static(path.resolve(APP_ROOT, './pages/public')));

app.get('/', auth, home);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Starting at http://localhost:${PORT}`);
});