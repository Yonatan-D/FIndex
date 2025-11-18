import fs from 'fs';
import path from 'path';

const generateLinks = ({ prefix = '/', buckets = []}) => {
  return buckets.map((node) => {
    return `
      <li>
        <a href="${prefix}${node.name}/" class="icon icon-directory" title="test-nvim">
          <span class="name">📁 ${node.name}</span>
        </a>
      </li>
    `;
  }).join("");
};

export const createHomePage = (config) => {
  const { homePath, prefix, title, buckets } = config;
  try {
    const templateContent = fs.readFileSync(homePath, 'utf8');
     
    const replacements = {
      "{title}": `Home | ${title}`,
      "{links}": generateLinks({ prefix, buckets }),
      "{home}": prefix,
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
