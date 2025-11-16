import c from 'kleur';
import express from 'express';
import serveIndex from 'serve-index';
import auth from '../middlewares/auth.js';
import download from '../middlewares/download.js';
import path from 'path';
import template from './template.js';

const DEFAULT_OPTIONS = {
  icons: true,
  view: 'details',
  // template: path.resolve(APP_ROOT, './pages/directory.html')
  template,
};

const createBucketRoutes = (buckets, options = {}) => {
  const router = express.Router();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  console.log(c.yellow('Loading buckets:'));

  buckets.forEach(node => {
    const routePath = `/${encodeURIComponent(node.name)}`;
    const middlewares = [
      auth,
      download,
      express.static(node.path),
      serveIndex(node.path, mergedOptions)
    ];
    router.use(routePath, middlewares);
    
    console.log(c.yellow(`${node.name}: ${node.path}`));
  })

  return router;
}

export default createBucketRoutes;
