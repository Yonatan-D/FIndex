import express from 'express'
import serveIndex from 'serve-index'
import fs from 'fs'
import config from './config.js'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'

const app = express()

const links = []

for (const node of config.NODE) {
  app.use('/' + node.name, express.static(node.path), serveIndex(node.path, { 'icons': true }))
  links.push(`
    <li>
      <a href="/${node.name}" class="icon icon-directory" title="test-nvim">
        <span class="name">📁${node.name}</span>
      </a>
    </li>
  `)
}

// 第一版：生成一个新的index.html
// const templateContent = fs.readFileSync('index.template.html', 'utf8')
// const renderContent = templateContent.replace('<!-- links -->', links.join(''))
// fs.writeFileSync('index.html', renderContent)

// app.get('/', (req, res) => {
//   res.sendFile(path.resolve('./index.html'))
// })

// 第二版：直接返回index.html
// app.get('/', (req, res, next) => {
//   try {
//     const templateContent = fs.readFileSync(path.resolve('./index.html'), 'utf8')
//     const renderContent = templateContent.toString().replace('<!-- links -->', links.join(''))

//     res.send(renderContent)
//   } catch (error) {
//     next(error)
//   }
// })

// 第三版：使用流式处理
app.get('/', async (req, res, next) => {
  try {
    const replaceStream = new Transform({
      transform(chunk, encoding, callback) {
        const templateContent = chunk.toString()
        const renderContent = templateContent.replace('<!-- links -->', links.join(''))
        this.push(renderContent)
        callback()
      }
    })

    await pipeline(
      fs.createReadStream(path.resolve('./index.html')),
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