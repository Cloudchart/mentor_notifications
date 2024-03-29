require('dotenv').load()

import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'
import dbConfig from '../config/database.json'

let basename = path.basename(module.filename)
let env = process.env.NODE_ENV || 'development'
let config = dbConfig[env]
let sequelize
let db = {}

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable])
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}

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
