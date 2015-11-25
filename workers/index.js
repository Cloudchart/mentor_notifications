import fs from 'fs'
import path from 'path'

let basename = path.basename(module.filename)
let workers = {}

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename)
  })
  .forEach((file) => {
    if (file.slice(-3) !== '.js') return
    workers[file.split('.')[0]] = require(path.join(__dirname, file))
  })

export default workers
