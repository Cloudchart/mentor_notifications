require('dotenv').load();
require('babel/register');
require('./models').sequelize.sync({ force: true });
