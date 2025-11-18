import fs from "fs";
import archiver from "archiver";
import config from "../config.js";
import dayjs from "dayjs";
import { filesize } from 'filesize';
const { PREFIX, BUCKETS } = config;

const getAbsolutePath = (url) => {
  const urlWithoutParams = decodeURIComponent(url).split("?")[0];
  const node = BUCKETS.find(node => urlWithoutParams.startsWith(`${PREFIX}${node.name}`));
  if (!node) throw new Error(`未找到匹配的桶: ${urlWithoutParams}`);
  const absolutePath = urlWithoutParams
    .replace(`${PREFIX}${node.name}`, node.path)
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

const download = async (filePath, res) => {
  return new Promise((resolve, reject) => {
    res.download(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

export default async (req, res, next) => {
  if (req.query.download === undefined) return next();

  let absolutePath = "";
  let tempZipFilePath = "";
  try {
    const { absolutePath, urlWithoutParams } = getAbsolutePath(req.originalUrl);
    if (fs.statSync(absolutePath).isFile()) {
      return download(absolutePath, res);
    }
    const fileName = absolutePath.split('/').pop() + '.zip';
    req.logger.info(`[Download] "%s" Requested path: "%s", Mapped to: "%s", Creating zip file...`, fileName, urlWithoutParams, absolutePath);
    const startTime = Date.now();
    tempZipFilePath = await createZipFile(absolutePath);
    const durationTime = Date.now() - startTime;
    const stats = fs.statSync(tempZipFilePath);
    req.logger.info(`[Download] "%s" Created successfully. OutPath: "%s", Size: %s, DurationTime: %d ms`, fileName, tempZipFilePath, filesize(stats.size), durationTime);

    await download(tempZipFilePath, res);
    cleanUpZipFile(tempZipFilePath);
  } catch (err) {
    req.logger.error(`[Download] Error processing: %s\n %s`, absolutePath, err);
    if (tempZipFilePath && fs.existsSync(tempZipFilePath)) {
      cleanUpZipFile(tempZipFilePath);
    }
    res.status(500).send("处理失败");
  }
};
