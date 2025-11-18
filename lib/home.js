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

export const createHomePage = () => {
  try {
    const templatePath = path.resolve(APP_ROOT, "./pages/index.html");
    const templateContent = fs.readFileSync(templatePath, 'utf8');
     
    const replacements = {
      "{title}": getTitle(),
      "{links}": generateLinks(),
      "{home}": PREFIX,
    };

    let renderContent = templateContent;
    for (const [key, value] of Object.entries(replacements)) {
      renderContent = renderContent.replaceAll(key, value);
    }

    return renderContent;
  } catch (error) {
    throw error;
  }
};
