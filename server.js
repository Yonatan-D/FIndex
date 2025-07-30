import express from 'express'
import serveIndex from 'serve-index'
import fs from 'fs'
import config from './config.js'
import path from 'path'

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

const templateContent = fs.readFileSync('index.template.html', 'utf8')
const renderContent = templateContent.replace('<!-- links -->', links.join(''))
fs.writeFileSync('index.html', renderContent)

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'))
})

app.listen(config.PORT, () => {
  console.log(`Starting at http://localhost:${config.PORT}`)
})