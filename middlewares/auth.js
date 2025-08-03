import config from "../config.js";

export default async (req, res, next) => {
  if (
    config.WHITE_IP.includes(req.hostname) ||
    (config.TOKEN &&
      (req.query?.token === config.TOKEN ||
        req.headers.cookie?.includes(`x-token=${config.TOKEN}`)))
  ) {
    return next();
  }
  res.status(401).send("无权限访问");
};
