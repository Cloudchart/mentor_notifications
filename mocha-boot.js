require('babel/register');
require('./models').sequelize.sync({ force: true });
process.env.POSTMARK_API_KEY = '9dd395f7-eae0-4cdc-b31f-d9ce4bb31852';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.WEBAPP_CLEARDB_DATABASE_URL = 'mysql://root@localhost/mentor_development';