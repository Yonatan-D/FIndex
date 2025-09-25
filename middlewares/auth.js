import config from "../config.js";

export const checkAuth = (req) => {
  const allowHost = config.IP_WHITE_LIST.includes(req.hostname);
  const allowToken = req.query?.token === config.TOKEN || req.headers.cookie?.includes(`x-token=${config.TOKEN}`);
  if (!config.TOKEN) {
    return {
      status: true,
      message: "no-token-set",
    };
  }
  if (allowHost) {
    return {
      status: true,
      message: "whitelist",
    };
  }
  if (allowToken) {
    return {
      status: true,
      message: "token",
    };
  }
  return {
    status: false,
    message: "无权限访问"
  };
};

export default async (req, res, next) => {
  const auth = checkAuth(req);
  if (auth.status) {
    return next();
  }
  res.status(401).send(auth.message);
};
