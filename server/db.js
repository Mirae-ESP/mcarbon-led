// PostgreSQL 연결 및 테이블 생성
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 없습니다. (.env.example 참고)");
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      uid         TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      role        TEXT NOT NULL DEFAULT 'user'    CHECK (role IN ('user','admin')),
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','disabled')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login  TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id          SERIAL PRIMARY KEY,
      owner_uid   TEXT NOT NULL REFERENCES users(uid),
      site        TEXT NOT NULL,
      inputs      JSONB NOT NULL,
      summary     JSONB NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS proposals_owner_idx ON proposals(owner_uid, updated_at DESC);
    CREATE TABLE IF NOT EXISTS downloads (
      id          SERIAL PRIMARY KEY,
      proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      uid         TEXT NOT NULL,
      kind        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, migrate };
