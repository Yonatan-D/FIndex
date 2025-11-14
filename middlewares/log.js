import c from 'kleur';
import dayjs from "dayjs";
import config from "../config.js";
import { checkAuth } from "./auth.js";
import Logger from '../lib/logger.js';

export default async (req, res, next) => {

  req.logger = new Logger(req);

  const filterRules = [
    '/favicon.ico',
    '/public/',
  ];

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const httpStatus = res.statusCode;
    const isFiltered = filterRules.some(rule => req.originalUrl.startsWith(rule) && (httpStatus === 304 || httpStatus === 200));
    const authStatus = checkAuth(req);

    const httpStatusWithColor = 
      httpStatus >= 500 ? c.red(httpStatus) :
      httpStatus >= 400 ? c.yellow(httpStatus) : 
      httpStatus;

    if (!isFiltered) {
      req.logger.info(`"${req.method} ${decodeURIComponent(req.originalUrl)}" ${httpStatusWithColor} - ${duration}ms | checkAuth:${authStatus.message}`);
    }
  });

  next();
};
