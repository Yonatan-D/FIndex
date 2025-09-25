import config from "../config.js";
const { IP_WHITE_LIST, TOKEN } = config;

export const checkAuth = (req) => {
  const allowHost = IP_WHITE_LIST.includes(req.hostname);
  const allowToken = req.query?.token === TOKEN || req.headers.cookie?.includes(`x-token=${TOKEN}`);
  if (!TOKEN) {
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
