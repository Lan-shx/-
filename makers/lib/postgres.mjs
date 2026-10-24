import pg from 'pg';

// Keep the existing research service unchanged. Translate its fixed queries to
// parameterized PostgreSQL, including the atomic claim used to reject replays.
const statements = new Map([
  ['DELETE FROM research_turns WHERE expires < ?',
    'DELETE FROM research_turns WHERE expires < $1'],
  ['SELECT payload,status FROM research_turns WHERE id=? AND sid=? AND expires>?',
    'SELECT payload,status FROM research_turns WHERE id=$1 AND sid=$2 AND expires>$3'],
  ['INSERT INTO research_turns (id,sid,payload,status,expires) VALUES (?,?,?,?,?)',
    'INSERT INTO research_turns (id,sid,payload,status,expires) VALUES ($1,$2,$3,$4,$5)'],
  ["UPDATE research_turns SET status='running' WHERE id=? AND sid=? AND status='awaiting' AND expires>? RETURNING payload",
    "UPDATE research_turns SET status='running' WHERE id=$1 AND sid=$2 AND status='awaiting' AND expires>$3 RETURNING payload"],
  ['UPDATE research_turns SET payload=?,status=? WHERE id=? AND sid=?',
    'UPDATE research_turns SET payload=$1,status=$2 WHERE id=$3 AND sid=$4'],
  ["UPDATE research_turns SET status='failed',payload='{}' WHERE id=? AND sid=?",
    "UPDATE research_turns SET status='failed',payload='{}' WHERE id=$1 AND sid=$2"],
]);

export function asResearchDatabase(pool) {
  return {
    async ready() {
      await pool.query('SELECT id FROM research_turns LIMIT 1');
    },
    prepare(sql) {
      const text = statements.get(sql);
      if (!text) throw new Error('Unsupported research database statement');
      return {
        bind(...values) {
          const count = (sql.match(/\?/g) || []).length;
          if (values.length !== count) throw new Error('Invalid database parameters');
          return {
            async first() {
              const result = await pool.query(text, values);
              return result.rows[0] ?? null;
            },
            async run() {
              const result = await pool.query(text, values);
              return { success: true, meta: { changes: result.rowCount } };
            },
          };
        },
      };
    },
  };
}

const databases = new Map();
export function getResearchDatabase(connectionString) {
  if (!connectionString) return undefined;
  if (databases.has(connectionString)) return databases.get(connectionString);
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('A PostgreSQL connection is required');
  }
  const pool = new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 7000,
    query_timeout: 8000,
    allowExitOnIdle: true,
  });
  // Never log a connection URL, database error details, or user payloads.
  pool.on('error', () => console.error('Research database connection failed'));
  const database = asResearchDatabase(pool);
  databases.set(connectionString, database);
  return database;
}
