import fs from "fs";
import archiver from "archiver";
import config from "../config.js";
import { logger } from "../middlewares/log.js";

const cleanUpTempFile = (tempFilePath) => {
  let level = 'info';
  let message = [];
  try {
    fs.unlinkSync(tempFilePath);
    message = ["[Download Zip] Cleaned up temporary file: %s", tempFilePath];
  } catch (error) {
    level = 'error';
    message = ["[Download Zip] Failed to clean up temporary file: %s", tempFilePath, error];
  }
  return [level, message];
}

export default async (req, res, next) => {
  if (req.query.download === undefined) return next();

  const log = logger(req);
  
  let absolutePath = "";
  let zipPath = "";
  try {
    const reqPath = decodeURIComponent(req.baseUrl + req.path);
    const node = config.NODE.find((node) =>
      reqPath.startsWith(`/${node.name}`)
    );

    absolutePath = reqPath
      .replace(`/${node.name}`, node.path)
      .replace(/\/$/, "");
    // console.log(
    //   "[Download] Requested path: %s, Mapped to: %s",
    //   reqPath,
    //   absolutePath
    // );

    if (fs.statSync(absolutePath).isFile()) return next();

    log.info("[Download Zip] Creating zip for directory: %s", absolutePath);
    zipPath = `${absolutePath}.zip`;
    const archive = fs.createWriteStream(zipPath);
    const zip = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    zip.pipe(archive);
    zip.directory(absolutePath, false);
    zip.finalize();

    archive.on("close", () => {
      log.info("[Download Zip] Zip created successfully: %s", zipPath);
      res.download(zipPath, (err) => {
        try {
          if (err) throw err;
          log.info("[Download Zip] File sent successfully: %s", zipPath);
          const [level, message] = cleanUpTempFile(zipPath);
          log[level](...message);
        } catch (err) {
          log.error("[Download Zip] Error sending file: %s", zipPath, err);
          const [level, message] = cleanUpTempFile(zipPath);
          log[level](...message);
          res.status(500).send("处理失败");
        }
      });
    });
  } catch (err) {
    log.error("[Download Zip] Error processing %s:", absolutePath, err);
    // 统一清理临时文件
    if (zipPath && fs.existsSync(zipPath)) {
      const [level, message] = cleanUpTempFile(zipPath);
      log[level](...message);
    }
    res.status(500).send("处理失败");
  }
};
