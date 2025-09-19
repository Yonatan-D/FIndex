import dayjs from "dayjs";
import config from "../config.js";

export default async (req, res, next) => {
  const filterRules = [
    '/public/',
  ]


  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const isFiltered = filterRules.some(rule => req.originalUrl.includes(rule));

  if (!isFiltered) {
    console.log(`[${time}] ${req.ip} ${req.method} ${decodeURIComponent(req.originalUrl)}`);
  }

  return next();
};
