import dayjs from "dayjs";
import config from "../config.js";
import { checkAuth } from "./auth.js";

export default async (req, res, next) => {
  const filterRules = [
    '/favicon.ico',
    '/public/',
  ]

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const time = dayjs(start).format('YYYY-MM-DD HH:mm:ss');
    const isFiltered = filterRules.some(rule => req.originalUrl.includes(rule));
    const authStatus = checkAuth(req);
    const httpStatus = res.statusCode;

    if (!isFiltered) {
      console.log(`${req.ip} -- [${time}] "${req.method} ${decodeURIComponent(req.originalUrl)}" ${httpStatus} - ${duration}ms | checkAuth:${authStatus.message}`);
    }
  });

  next();
};
