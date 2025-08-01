import express from 'express'
import serveIndex from 'serve-index'
import fs from 'fs'
import config from './config.js'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import archiver from 'archiver'

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

// 处理下载请求
app.use((req, res, next) => {
  if (req.query.download === undefined)
    return next()

  try {
    const reqPath = decodeURIComponent(req.path)
    const node = config.NODE.find(node => reqPath.startsWith(`/${node.name}`))
    const absolutePath = reqPath.replace(`/${node.name}`, node.path)
    console.log('[Download] Requested path: %s, Mapped to: %s', reqPath, absolutePath)

    if (fs.statSync(absolutePath).isFile())
      return next()

    console.log('[Download] Creating zip for directory: %s', absolutePath)
    const zipPath = `${absolutePath}.zip`
    const archive = fs.createWriteStream(zipPath)
    const zip = archiver('zip', { zlib: { level: 9 } })

    archive.on('error', (err) => { throw err })

    zip.pipe(archive);
    zip.directory(absolutePath, false)
    zip.finalize()

    archive.on('close', () => {
      console.log('[Download] Zip created successfully: %s', zipPath)
      res.download(zipPath, (err) => {
        if (err) throw err
        console.log('[Download] File sent successfully: %s', zipPath)
        // 成功后也清理临时文件
        try {
          fs.unlinkSync(zipPath);
          console.log('[Download] Cleaned up temporary file: %s', zipPath);
        } catch (cleanupErr) {
          console.error('[Download] Failed to clean up temporary file: %s', zipPath, cleanupErr)
        }
      })
    })

  } catch (err) {
    console.error('[Download] Error processing %s:', absolutePath, err)
    // 统一清理临时文件
    if (zipPath && fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath)
        console.log('[Download] Cleaned up temporary file: %s', zipPath)
      } catch (cleanupErr) {
        console.error('[Download] Failed to clean up temporary file: %s', zipPath, cleanupErr)
      }
    }
    res.status(500).send('处理失败')
  }
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