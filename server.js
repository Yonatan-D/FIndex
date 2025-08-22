import express from 'express'
import serveIndex from 'serve-index'
import path from 'path'
import config from './config.js'
import auth from './middlewares/auth.js'
import download from './functions/download.js'
import home from './functions/home.js'
import template from './functions/template.js'

const app = express()

for (const node of config.NODE) {
  app.use(`/${node.name}`, auth, download, express.static(node.path), serveIndex(node.path, {
    icons: true,
    view: 'details',
    // template: path.resolve('./pages/directory.html')
    template,
  }))
  console.log(node.name + ': ' + node.path)
}

app.use('/public', express.static(path.resolve('./pages/public')))

app.get('/', auth, home)

app.listen(config.PORT, () => {
  console.log(`Starting at http://localhost:${config.PORT}`)
})