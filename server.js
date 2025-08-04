import express from 'express'
import serveIndex from 'serve-index'
import fs from 'fs'
import path from 'path'
import config from './config.js'
import auth from './middlewares/auth.js'
import download from './middlewares/download.js'
import home from './home.js'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { filesize } from 'filesize'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

const app = express()

for (const node of config.NODE) {
  app.use(`/${node.name}`, auth, download, express.static(node.path), serveIndex(node.path, {
    icons: true,
    view: 'details',
    // template: path.resolve('./pages/directory.html')
    template: async (locals, callback) => {
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
        list.unshift(`<li class="header"><span class="name">Name</span><span class="size">Size</span><span class="date">Modified</span></li>`);
        list = `<ul id="files" class="view-${locals.viewName}">${list.join('')}</ul>`;
        return list;
      }

      let renderContent = fs.readFileSync(path.resolve("./pages/directory.html"), 'utf-8');
      renderContent = renderContent.replace("{linked-path}", locals.directory);
      renderContent = renderContent.replace("{files}", generateFileList(locals.fileList));
  
      callback(null, renderContent);
    }
  }))
  console.log(node.name + ': ' + node.path)
}

app.use('/web/components', express.static(path.resolve('./pages/components')))
app.use('/web/js', express.static(path.resolve('./pages/js')))
app.use('/web/css', express.static(path.resolve('./pages/css')))

app.get('/', auth, home)

app.listen(config.PORT, () => {
  console.log(`Starting at http://localhost:${config.PORT}`)
})