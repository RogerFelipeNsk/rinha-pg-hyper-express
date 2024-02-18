import pg from 'pg';
const dbConfig = {
  host: process.env.DB_HOSTNAME || 'localhost',
  port: 5432,
  database: 'rinha',
  user: 'admin',
  keepAlive: true,
  password: '123',
  max: 15,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 60_000,
};

const pgPool = new pg.Pool(dbConfig);

export const getPgClient = async (pool) => {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {}
};

export default pgPool;
