import fs from 'fs'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import config from '../config.js'

const generateLinks = () => {
  return config.NODE.map((node) => {
    return `
          <li>
            <a href="/${node.name}" class="icon icon-directory" title="test-nvim">
              <span class="name">${node.name}</span>
            </a>
          </li>
        `;
  }).join("");
};

export default async (req, res, next) => {
  try {
    // 创建一个转换流用于替换模板中的占位符
    const replaceStream = new Transform({
      transform(chunk, encoding, callback) {
        const templateContent = chunk.toString();
        // 替换 <!-- links --> 为动态生成的链接列表
        const renderContent = templateContent.replace(
          "<!-- links -->",
          generateLinks()
        );
        this.push(renderContent);
        callback();
      },
    });

    await pipeline(
      fs.createReadStream(path.resolve("./pages/index.html")),
      replaceStream,
      res
    );
  } catch (error) {
    next(error);
  }
};
