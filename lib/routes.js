import c from 'kleur';
import express from 'express';
import serveIndex from 'serve-index';
import { createDownloadMiddleware } from './download.js';
import { createHomePage } from './home.js';
import path from 'path';
import { createTemplateRenderer } from './template.js';
import config from '../config.js';
const { APP_ROOT, PREFIX, BUCKETS, TITLE } = config;

const DEFAULT_OPTIONS = {
  SERVE_INDEX_OPTIONS: {
    icons: true,
    view: 'details',
    // template: path.resolve(APP_ROOT, './pages/directory.html')
    template: createTemplateRenderer({
      title: TITLE,
      prefix: PREFIX,
      iconPath: path.resolve(APP_ROOT, './pages/icons/'),
      templatePath: path.resolve(APP_ROOT, './pages/directory.html'),
    }),
  },
  STATIC_OPTIONS: {
    maxAge: '1d',
    etag: true,
  },
  DOWNLOAD_OPTIONS: {
    prefix: PREFIX,
    buckets: BUCKETS,
  }
};

const createBucketRoutes = (buckets, options = {}) => {
  const router = express.Router();
  const { SERVE_INDEX_OPTIONS, STATIC_OPTIONS, DOWNLOAD_OPTIONS } = { ...DEFAULT_OPTIONS, ...options };
  
  console.log(c.yellow('Loading buckets:'));

  buckets.forEach(node => {
    const routePath = `/${encodeURIComponent(node.name)}`;
    const middlewares = [
      createDownloadMiddleware(DOWNLOAD_OPTIONS),
      express.static(node.path, STATIC_OPTIONS),
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

  router.use('/', (req, res, next) => {
    try {
      const html = createHomePage({
        homePath: path.resolve(APP_ROOT, './pages/index.html'),
        prefix: PREFIX,
        title: TITLE,
        buckets: BUCKETS,
      });
      res.send(html);
    } catch (error) {
      next(error);
    }
  });
  return router;
}

const createAllRoutes = (options = {}) => {
  const router = express.Router();

  router.use(createBucketRoutes(BUCKETS, options));
  router.use(createPublicRoutes(path.resolve(APP_ROOT, './pages/public'), options));
  router.use(createHomeRoutes());

  return router;
}

export default createAllRoutes;
