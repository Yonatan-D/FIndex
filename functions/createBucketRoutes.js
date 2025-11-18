import c from 'kleur';
import express from 'express';
import serveIndex from 'serve-index';
import auth from '../middlewares/auth.js';
import download from '../middlewares/download.js';
import home from '../middlewares/home.js';
import path from 'path';
import template from './template.js';
import config from '../config.js';
const { APP_ROOT, BUCKETS } = config;

const DEFAULT_OPTIONS = {
  SERVE_INDEX_OPTIONS: {
    icons: true,
    view: 'details',
    // template: path.resolve(APP_ROOT, './pages/directory.html')
    template,
  },
  STATIC_OPTIONS: {
    maxAge: '1d',
    etag: true,
  }
};

const createBucketRoutes = (buckets, options = {}) => {
  const router = express.Router();
  const { SERVE_INDEX_OPTIONS } = { ...DEFAULT_OPTIONS, ...options };
  
  console.log(c.yellow('Loading buckets:'));

  buckets.forEach(node => {
    const routePath = `/${encodeURIComponent(node.name)}`;
    const middlewares = [
      auth,
      download,
      express.static(node.path),
      serveIndex(node.path, SERVE_INDEX_OPTIONS)
    ];
    router.use(routePath, middlewares);
    
    console.log(c.yellow(`${node.name}: ${node.path}`));
  })

  return router;
};

const createPublicRoutes = (publicPath, options = {}) => {
  const router = express.Router();
  const { STATIC_OPTIONS } = { ...DEFAULT_OPTIONS, ...options };

  router.use('/public', express.static(publicPath, STATIC_OPTIONS));

  return router;
};

const createHomeRoutes = () => {
  const router = express.Router();

  router.use('/', auth, home);

  return router;
}

const createAllRoutes = (options = {}) => {
  const router = express.Router();

  router.use(createBucketRoutes(BUCKETS));
  router.use(createPublicRoutes(path.resolve(APP_ROOT, './pages/public')));
  router.use(createHomeRoutes());

  return router;
}

export default createAllRoutes;
