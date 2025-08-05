import fs from 'fs'
import path from 'path'
import { filesize } from 'filesize'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export default async (locals, callback) => {
  const generateFileList = (fileList) => {
    let list = fileList.map(file =>
      `<li style="width: 100%">
        <a href="${file.name}">
          <span class="name">${file.name}</span>
          <span class="date">${dayjs(file.stat.mtime).fromNow()}</span>
          <span class="size">${filesize(file.stat.size)}</span>
        </a>
      </li>`
    );
    list.unshift(
      `<li class="header">
        <span class="name">Name</span>
        <span class="size">Size</span>
        <span class="date">Modified</span>
      </li>`
    );
    list = `<ul id="files" class="view-${locals.viewName}">${list.join('')}</ul>`;
    return list;
  }

  let renderContent = fs.readFileSync(path.resolve("./pages/directory.html"), 'utf-8');
  renderContent = renderContent.replace("{linked-path}", locals.directory);
  renderContent = renderContent.replace("{files}", generateFileList(locals.fileList));

  callback(null, renderContent);
}