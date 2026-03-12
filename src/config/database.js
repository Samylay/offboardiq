const knex = require('knex');

const environments = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'offboardiq_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: '../../migrations' },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 5, max: 30 },
    migrations: { directory: '../../migrations' },
  },
  test: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'offboardiq_test',
      user: 'postgres',
      password: 'postgres',
    },
    pool: { min: 2, max: 5 },
    migrations: { directory: '../../migrations' },
  },
};

const env = process.env.NODE_ENV || 'development';
const db = knex(environments[env]);

module.exports = { db, environments };
