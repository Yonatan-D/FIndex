import c from 'kleur';
import dayjs from "dayjs";
import config from "../config.js";
import { checkAuth } from "./auth.js";
let _req = {};

export const logger = () => {
  const date = dayjs().format("YYYY-MM-DD HH:mm:ss");

  return {
    info: (...args) => {
      const arg0 = args.shift();
      console.log(`${_req.ip} -- [${date}] | INFO  | ${arg0}`, ...args);
    },
    error: (...args) => {
      const arg0 = args.shift();
      console.error(c.red(`${_req.ip} -- [${date}] | ERROR | ${arg0}}`), ...args);
    },
  };
};

export default async (req, res, next) => {
  _req = req;

  const filterRules = [
    '/favicon.ico',
    '/public/',
  ];

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const time = dayjs(start).format('YYYY-MM-DD HH:mm:ss');
    const httpStatus = res.statusCode;
    const isFiltered = filterRules.some(rule => req.originalUrl.startsWith(rule) && (httpStatus === 304 || httpStatus === 200));
    const authStatus = checkAuth(req);

    const httpStatusWithColor = 
      httpStatus >= 500 ? c.red(httpStatus) :
      httpStatus >= 400 ? c.yellow(httpStatus) : 
      httpStatus;

    if (!isFiltered) {
      console.log(`${req.ip} -- [${time}] "${req.method} ${decodeURIComponent(req.originalUrl)}" ${httpStatusWithColor} - ${duration}ms | checkAuth:${authStatus.message}`);
    }
  });

  next();
};
