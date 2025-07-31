import express from 'express'
import serveIndex from 'serve-index'
import fs from 'fs'
import config from './config.js'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'

const app = express()

app.use((req, res, next) => {
  if (req.url.startsWith('/web') ||
    req.url.startsWith('/favicon.ico') ||
    config.TOKEN && (
      req.query?.token === config.TOKEN ||
      req.headers.cookie?.includes(`x-token=${config.TOKEN}`)
    ) ||
    config.WHITE_IP.includes(req.hostname)
  ) {
    return next()
  }
  res.status(401).send('无权限访问')
})

for (const node of config.NODE) {
  app.use('/' + node.name, express.static(node.path), serveIndex(node.path, { 'icons': true, view: 'details', template: path.resolve('./pages/directory.html') }))
  console.log(node.name + ': ' + node.path)
}

app.use('/web/components', express.static(path.resolve('./pages/components')))
app.use('/web/js', express.static(path.resolve('./pages/js')))

const generateLinks = () => {
  return config.NODE
    .map(node => {
      return `
        <li>
          <a href="/${node.name}" class="icon icon-directory" title="test-nvim">
            <span class="name">📁${node.name}</span>
          </a>
        </li>
      `
    })
    .join('')
}

app.get('/', async (req, res, next) => {
  try {
    // 创建一个转换流用于替换模板中的占位符
    const replaceStream = new Transform({
      transform(chunk, encoding, callback) {
        const templateContent = chunk.toString()
        // 替换 <!-- links --> 为动态生成的链接列表
        const renderContent = templateContent.replace('<!-- links -->', generateLinks())
        this.push(renderContent)
        callback()
      }
    })

    await pipeline(
      fs.createReadStream(path.resolve('./pages/index.html')),
      replaceStream,
      res
    )
  } catch (error) {
    next(error)
  }
})

app.listen(config.PORT, () => {
  console.log(`Starting at http://localhost:${config.PORT}`)
})