import fs from "fs";
import archiver from "archiver";
import config from "../config.js";
import { logger } from "../middlewares/log.js";
import dayjs from "dayjs";
import { filesize } from 'filesize'
const log = logger();

const getAbsolutePath = (url) => {
  const urlWithoutParams = decodeURIComponent(url).split("?")[0];
  const node = config.NODE.find((node) =>
    urlWithoutParams.startsWith(`/${node.name}`)
  );
  const absolutePath = urlWithoutParams
    .replace(`/${node.name}`, node.path)
    .replace(/\/$/, "");
  const fileName = absolutePath.split('/').pop() + '.zip';
  log.info(`[Download] "%s" Requested path: "%s", Mapped to: "%s"`, fileName, urlWithoutParams, absolutePath);
  return absolutePath;
}

const createZipFile = (sourceDir) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const fileName = sourceDir.split('/').pop() + '.zip';
    log.info(`[Download] "%s" Downloading directory: "%s", Creating zip file...`, fileName, sourceDir);

    const tempDir = `/tmp/FIndex/${dayjs().format('YYYYMMDD')}/`;
    fs.mkdirSync(tempDir, { recursive: true });

    const outPath = `${tempDir}${fileName}`;
    const archive = fs.createWriteStream(outPath);
    const zip = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      reject(err);
    });

    zip.pipe(archive);
    zip.directory(sourceDir, false);
    zip.finalize();

    archive.on("close", () => {
      const durationTime = Date.now() - startTime;
      const stats = fs.statSync(outPath);
      log.info(`[Download] "%s" Created successfully. OutPath: "%s", Size: %s, DurationTime: %d ms`, fileName, outPath, filesize(stats.size), durationTime);
      resolve(outPath);
    });
  });
};

const cleanUpZipFile = (tempFilePath) => {
  const fileName = tempFilePath.split('/').pop();
  try {
    fs.unlinkSync(tempFilePath);
    log.info(`[Download] "%s" Cleaned up temporary file`, fileName);
  } catch (error) {
    log.error(`[Download] "%s" Failed to clean up temporary file:\n %s`, fileName, error);
  }
}

export default async (req, res, next) => {
  if (req.query.download === undefined) return next();

  let absolutePath = "";
  let tempZipFilePath = "";
  try {
    const absolutePath = getAbsolutePath(req.originalUrl);

    if (fs.statSync(absolutePath).isFile()) return next();

    tempZipFilePath = await createZipFile(absolutePath);

    res.download(tempZipFilePath, (err) => {
      const fileName = tempZipFilePath.split('/').pop();
      if (err) {
        log.error(`[Download] "%s" Error sending file:\n %s`, fileName, err);
        cleanUpZipFile(tempZipFilePath);
        return res.status(500).send("处理失败");
      }

      log.info(`[Download] "%s" Successfully sent file`, fileName);
      cleanUpZipFile(tempZipFilePath);
    });
  } catch (err) {
    log.error(`[Download] Error processing: %s\n %s`, absolutePath, err);
    // 统一清理临时文件
    if (tempZipFilePath && fs.existsSync(tempZipFilePath)) {
      cleanUpZipFile(tempZipFilePath);
    }
    res.status(500).send("处理失败");
  }
};
