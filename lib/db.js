import knex from 'knex';

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'offboardiq_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  pool: { min: 2, max: 10 },
};

if (process.env.DATABASE_URL) {
  config.connection = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  };
}

// Reuse connection in development (Next.js hot reload)
const globalForKnex = globalThis;
const db = globalForKnex.__knex || knex(config);
if (process.env.NODE_ENV !== 'production') globalForKnex.__knex = db;

export { db };
