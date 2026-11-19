import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

/** PostgreSQL is the ONLY authoritative source of seat and booking state. */
export class PostgresService {
  private pool: pg.Pool | null = null;
  private connected = false;

  async init(): Promise<void> {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required. See SETUP_WINDOWS.md.');
    this.pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX || 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });
    try {
      await this.pool.query('SELECT 1');
      const candidates = [
        path.resolve('src/database/schema.sql'),
        path.resolve('backend/src/database/schema.sql'),
        path.resolve('dist/database/schema.sql'),
      ];
      const schema = candidates.find((file) => fs.existsSync(file));
      if (!schema) throw new Error('Database schema.sql was not found');
      await this.pool.query(fs.readFileSync(schema, 'utf8'));
      this.connected = true;
      console.log('PostgreSQL connected; schema verified.');
    } catch (error) {
      await this.pool.end();
      this.pool = null;
      throw error;
    }
  }

  getConnected(): boolean { return this.connected; }
  getPool(): pg.Pool {
    if (!this.pool || !this.connected) throw new Error('PostgreSQL has not been initialized');
    return this.pool;
  }
  async query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<pg.QueryResult<T>> {
    return this.getPool().query<T>(sql, params);
  }
  async withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async shutdown(): Promise<void> {
    if (this.pool) await this.pool.end();
    this.connected = false;
  }
}
export const postgresService = new PostgresService();
