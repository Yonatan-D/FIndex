import fs from "fs";
import archiver from "archiver";
import config from "../config.js";
import dayjs from "dayjs";
import { filesize } from 'filesize';
const { BUCKETS } = config;

const getAbsolutePath = (url) => {
  const urlWithoutParams = decodeURIComponent(url).split("?")[0];
  const node = BUCKETS.find(node => urlWithoutParams.startsWith(`/${node.name}`));
  const absolutePath = urlWithoutParams
    .replace(`/${node.name}`, node.path)
    .replace(/\/$/, "");
  return { absolutePath, urlWithoutParams };
};

const createZipFile = (sourceDir) => {
  return new Promise((resolve, reject) => {
    const fileName = sourceDir.split('/').pop() + '.zip';

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
      resolve(outPath);
    });
  });
};

const cleanUpZipFile = (tempFilePath) => {
  fs.unlinkSync(tempFilePath);
};

export default async (req, res, next) => {
  if (req.query.download === undefined) return next();

  let absolutePath = "";
  let tempZipFilePath = "";
  try {
    const { absolutePath, urlWithoutParams } = getAbsolutePath(req.originalUrl);
    const fileName = absolutePath.split('/').pop() + '.zip';
    req.logger.info(`[Download] "%s" Requested path: "%s", Mapped to: "%s"`, fileName, urlWithoutParams, absolutePath);

    if (fs.statSync(absolutePath).isFile()) return next();

    req.logger.info(`[Download] "%s" Downloading directory: "%s", Creating zip file...`, fileName, absolutePath);
    const startTime = Date.now();
    tempZipFilePath = await createZipFile(absolutePath);
    const durationTime = Date.now() - startTime;
    const stats = fs.statSync(tempZipFilePath);
    req.logger.info(`[Download] "%s" Created successfully. OutPath: "%s", Size: %s, DurationTime: %d ms`, fileName, tempZipFilePath, filesize(stats.size), durationTime);

    res.download(tempZipFilePath, (err) => {
      if (err) {
        req.logger.error(`[Download] "%s" Error sending file "%s" :\n %s`, fileName, tempZipFilePath, err);
        cleanUpZipFile(tempZipFilePath);
        return res.status(500).send("处理失败");
      }

      req.logger.info(`[Download] "%s" Successfully sent file`, fileName);
      cleanUpZipFile(tempZipFilePath);
    });
  } catch (err) {
    req.logger.error(`[Download] Error processing: %s\n %s`, absolutePath, err);
    // 统一清理临时文件
    if (tempZipFilePath && fs.existsSync(tempZipFilePath)) {
      cleanUpZipFile(tempZipFilePath);
    }
    res.status(500).send("处理失败");
  }
};
