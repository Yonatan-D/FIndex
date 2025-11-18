import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import config from '../config.js';
const { APP_ROOT, PREFIX, TITLE, BUCKETS } = config;

const getTitle = () => {
  return `Home | ${TITLE}`;
}

const generateLinks = () => {
  return BUCKETS.map((node) => {
    return `
      <li>
        <a href="${PREFIX}${node.name}/" class="icon icon-directory" title="test-nvim">
          <span class="name">📁 ${node.name}</span>
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
        const templateContent = chunk.toString('utf8');
        const replacements = {
          "{title}": getTitle(),
          "{links}": generateLinks(),
          "{home}": PREFIX,
        };
        let renderContent = templateContent;
        for (const [key, value] of Object.entries(replacements)) {
          renderContent = renderContent.replace(key, value);
        }
        this.push(renderContent);
        callback();
      },
    });

    await pipeline(
      fs.createReadStream(path.resolve(APP_ROOT, "./pages/index.html")),
      replaceStream,
      res
    );
  } catch (error) {
    next(error);
  }
};
