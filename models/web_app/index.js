import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'
import dbConfig from '../../config/database.json'

let basename = path.basename(module.filename)
let config = dbConfig.webApp
let sequelize = new Sequelize(process.env[config.use_env_variable])
let db = {}

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename)
  })
  .forEach((file) => {
    if (file.slice(-3) !== '.js') return
    let model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

export default db
