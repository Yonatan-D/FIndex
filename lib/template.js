import fs from 'fs';
import path from 'path';
import { filesize } from 'filesize';
import dayjs from 'dayjs';
import mime from 'mime-types';
import 'dayjs/locale/zh-cn.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

// dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export const createTemplateRenderer = (config) => {
  const { title, prefix, iconPath, templatePath } = config;
  const cache = {};
  
  const load = (icon) => {
    if (cache[icon]) return cache[icon];
    console.log('========> icon', iconPath);
    
    return cache[icon] = fs.readFileSync(`${iconPath}/${icon}`, 'base64');
  };

  const getStyle = (fileList) => {
    const rules = {};
    fileList.forEach(file => {
      const icon = getIcon(file.name);
      if (!rules[icon.className]) {
        rules[icon.className] = {
          selector: `#files .${icon.className} .name`,
          content: `background-image: url(data:image/png;base64,${load(icon.fileName)});`,
        };
      }
    });
    rules['icon-directory'] = {
      selector: '#files .icon-directory .name',
      content: `background-image: url(data:image/png;base64,${load(icons.folder)});`,
    };
    const style = [];
    for (const iconName in rules) {
      style.push(`${rules[iconName].selector} {\n  ${rules[iconName].content}\n}`);
    }
    return style.join('\n');
  };

  const getIcon = (filename) => {
    const ext = path.extname(filename);
  
    // try by extension
    if (icons[ext]) {
      return {
        className: 'icon-' + ext.substring(1),
        fileName: icons[ext]
      };
    }
  
    const mimetype = mime.lookup(ext);
  
    // default if no mime type
    if (mimetype === false) {
      return {
        className: 'icon-default',
        fileName: icons.default
      };
    }
  
    // try by mime type
    if (icons[mimetype]) {
      return {
        className: 'icon-' + mimetype.replace('/', '-'),
        fileName: icons[mimetype]
      };
    }
  
    const suffix = mimetype.split('+')[1];
  
    if (suffix && icons['+' + suffix]) {
      return {
        className: 'icon-' + suffix,
        fileName: icons['+' + suffix]
      };
    }
  
    const type = mimetype.split('/')[0];
  
    // try by type only
    if (icons[type]) {
      return {
        className: 'icon-' + type,
        fileName: icons[type]
      };
    }
  
    return {
      className: 'icon-default',
      fileName: icons.default
    };
  };

  const getClassName = (displayIcons, file) => {
    const classes = [];
    const isDir = file.stat && file.stat.isDirectory();
    
    if (displayIcons) {
      classes.push('icon');
      if (isDir) {
        classes.push('icon-directory');
      } else {
        const icon = getIcon(file.name);
        classes.push(icon.className);
      }
    }

    return classes.join(' ');
  };

  const generateFileList = (locals) => {
    let list = locals.fileList.map(file => {
      const isDir = file.stat && file.stat.isDirectory();
      const url = isDir
        ? file.name + '/'
        : file.name;
      const size = !isDir
        ? filesize(file.stat.size)
        : '';
      const date = file.stat && file.name !== '..'
        ? dayjs(file.stat.mtime).format('YYYY-MM-DD HH:mm:ss')
        : '';
      const fromNowDate = file.stat && file.name !== '..'
        ? dayjs(file.stat.mtime).fromNow()
        : '';

      return `
        <li>
          <a href="${url}" class="${getClassName(locals.displayIcons, file)}">
            <span class="name">${file.name}</span>
            <span class="size">${size}</span>
            <span class="date" title="${date}">${fromNowDate}</span>
          </a>
        </li>
      `
    });
    list.unshift(
      `<li class="header">
        <span class="name">Name</span>
        <span class="size">Size</span>
        <span class="date">Modified</span>
      </li>`
    );
    list = `<ul id="files" class="view-${locals.viewName}">${list.join('')}</ul>`;
    return list;
  };

  const getTitle = (locals) => {
    const currentDirectory = locals.directory
      .split('/')
      .filter(Boolean)
      .pop();
    return `${currentDirectory} | ${title}`;
  }

  return async (locals, callback) => {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const replacements = {
      "{title}": getTitle(locals),
      "{linked-path}": locals.directory,
      "{files}": generateFileList(locals),
      "{style}": getStyle(locals.fileList),
      "{home}": prefix,
    }
    let renderContent = templateContent;
    for (const [key, value] of Object.entries(replacements)) {
      renderContent = renderContent.replaceAll(key, value);
    }
    callback(null, renderContent);
  }

}

/**
 * Icon map.
 */
const icons = {
  // base icons
  'default': 'page_white.png',
  'folder': 'folder.png',

  // generic mime type icons
  'image': 'image.png',
  'text': 'page_white_text.png',
  'video': 'film.png',

  // generic mime suffix icons
  '+json': 'page_white_code.png',
  '+xml': 'page_white_code.png',
  '+zip': 'box.png',

  // specific mime type icons
  'application/font-woff': 'font.png',
  'application/javascript': 'page_white_code_red.png',
  'application/json': 'page_white_code.png',
  'application/msword': 'page_white_word.png',
  'application/pdf': 'page_white_acrobat.png',
  'application/postscript': 'page_white_vector.png',
  'application/rtf': 'page_white_word.png',
  'application/vnd.ms-excel': 'page_white_excel.png',
  'application/vnd.ms-powerpoint': 'page_white_powerpoint.png',
  'application/vnd.oasis.opendocument.presentation': 'page_white_powerpoint.png',
  'application/vnd.oasis.opendocument.spreadsheet': 'page_white_excel.png',
  'application/vnd.oasis.opendocument.text': 'page_white_word.png',
  'application/x-7z-compressed': 'box.png',
  'application/x-sh': 'application_xp_terminal.png',
  'application/x-font-ttf': 'font.png',
  'application/x-msaccess': 'page_white_database.png',
  'application/x-shockwave-flash': 'page_white_flash.png',
  'application/x-sql': 'page_white_database.png',
  'application/x-tar': 'box.png',
  'application/x-xz': 'box.png',
  'application/xml': 'page_white_code.png',
  'application/zip': 'box.png',
  'image/svg+xml': 'page_white_vector.png',
  'text/css': 'page_white_code.png',
  'text/html': 'page_white_code.png',
  'text/less': 'page_white_code.png',

  // other, extension-specific icons
  '.accdb': 'page_white_database.png',
  '.apk': 'box.png',
  '.app': 'application_xp.png',
  '.as': 'page_white_actionscript.png',
  '.asp': 'page_white_code.png',
  '.aspx': 'page_white_code.png',
  '.bat': 'application_xp_terminal.png',
  '.bz2': 'box.png',
  '.c': 'page_white_c.png',
  '.cab': 'box.png',
  '.cfm': 'page_white_coldfusion.png',
  '.clj': 'page_white_code.png',
  '.cc': 'page_white_cplusplus.png',
  '.cgi': 'application_xp_terminal.png',
  '.cpp': 'page_white_cplusplus.png',
  '.cs': 'page_white_csharp.png',
  '.db': 'page_white_database.png',
  '.dbf': 'page_white_database.png',
  '.deb': 'box.png',
  '.dll': 'page_white_gear.png',
  '.dmg': 'drive.png',
  '.docx': 'page_white_word.png',
  '.erb': 'page_white_ruby.png',
  '.exe': 'application_xp.png',
  '.fnt': 'font.png',
  '.gam': 'controller.png',
  '.gz': 'box.png',
  '.h': 'page_white_h.png',
  '.ini': 'page_white_gear.png',
  '.iso': 'cd.png',
  '.jar': 'box.png',
  '.java': 'page_white_cup.png',
  '.jsp': 'page_white_cup.png',
  '.lua': 'page_white_code.png',
  '.lz': 'box.png',
  '.lzma': 'box.png',
  '.m': 'page_white_code.png',
  '.map': 'map.png',
  '.msi': 'box.png',
  '.mv4': 'film.png',
  '.otf': 'font.png',
  '.pdb': 'page_white_database.png',
  '.php': 'page_white_php.png',
  '.pl': 'page_white_code.png',
  '.pkg': 'box.png',
  '.pptx': 'page_white_powerpoint.png',
  '.psd': 'page_white_picture.png',
  '.py': 'page_white_code.png',
  '.rar': 'box.png',
  '.rb': 'page_white_ruby.png',
  '.rm': 'film.png',
  '.rom': 'controller.png',
  '.rpm': 'box.png',
  '.sass': 'page_white_code.png',
  '.sav': 'controller.png',
  '.scss': 'page_white_code.png',
  '.srt': 'page_white_text.png',
  '.tbz2': 'box.png',
  '.tgz': 'box.png',
  '.tlz': 'box.png',
  '.vb': 'page_white_code.png',
  '.vbs': 'page_white_code.png',
  '.xcf': 'page_white_picture.png',
  '.xlsx': 'page_white_excel.png',
  '.yaws': 'page_white_code.png'
};