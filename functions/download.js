import fs from "fs";
import archiver from "archiver";
import config from "../config.js";

export default async (req, res, next) => {
  if (req.query.download === undefined) return next();

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
    console.log(
      "[Download Zip] Requested path: %s, Mapped to: %s",
      reqPath,
      absolutePath
    );

    if (fs.statSync(absolutePath).isFile()) return next();

    console.log("[Download Zip] Creating zip for directory: %s", absolutePath);
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
      console.log("[Download Zip] Zip created successfully: %s", zipPath);
      res.download(zipPath, (err) => {
        if (err) throw err;
        console.log("[Download Zip] File sent successfully: %s", zipPath);
        // 成功后也清理临时文件
        try {
          fs.unlinkSync(zipPath);
          console.log("[Download Zip] Cleaned up temporary file: %s", zipPath);
        } catch (cleanupErr) {
          console.error(
            "[Download Zip] Failed to clean up temporary file: %s",
            zipPath,
            cleanupErr
          );
        }
      });
    });
  } catch (err) {
    console.error("[Download Zip] Error processing %s:", absolutePath, err);
    // 统一清理临时文件
    if (zipPath && fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
        console.log("[Download Zip] Cleaned up temporary file: %s", zipPath);
      } catch (cleanupErr) {
        console.error(
          "[Download Zip] Failed to clean up temporary file: %s",
          zipPath,
          cleanupErr
        );
      }
    }
    res.status(500).send("处理失败");
  }
};
