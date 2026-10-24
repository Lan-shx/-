import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { asResearchDatabase, getResearchDatabase } from '../lib/postgres.mjs';
import { createResearchHandler } from '../cloud-functions/api/research/[action].js';

const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
const key = 'test-only-not-a-real-key';
const env = { DEEPSEEK_API_KEY: key, DATABASE_URL: 'postgresql://unused.test/example' };
const body = { question: '比较薪资', dataset: 'snapshot-v28', context: { filters: { cities: ['上海'] } } };
const request = (action, data, cookie = '', origin = 'https://example.test') => new Request('https://example.test/api/research/' + action, {
  method: 'POST', headers: { origin, 'content-type': 'application/json', cookie }, body: JSON.stringify(data),
});
const tool = { id: 'call1', type: 'function', function: { name: 'query', arguments: '{"filters":{"cities":["上海"]}}' } };
const result = { id: 'call1', result: { ref: 'R1', summary: { records: 20 } } };
const mock = message => async (url, init) => {
  assert.equal(url, 'https://api.deepseek.com/chat/completions');
  assert.equal(init.headers.Authorization, 'Bearer ' + key);
  return Response.json({ choices: [{ message, finish_reason: 'stop' }] });
};

async function setup(t) {
  const sql = new PGlite();
  t.after(() => sql.close());
  await sql.exec(schema);
  const pool = { async query(text, values) {
    const response = await sql.query(text, values);
    return { rows: response.rows, rowCount: response.affectedRows ?? response.rows.length };
  } };
  return { sql, database: asResearchDatabase(pool) };
}

test('model tool loop, session isolation, history and replay protection on PostgreSQL', async t => {
  const { sql, database } = await setup(t);
  let reply = { tool_calls: [tool], content: null };
  const handle = createResearchHandler({ getDatabase: () => database, fetcher: (...args) => mock(reply)(...args) });
  let response = await handle({ request: request('start', body), env });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict;.*Secure/);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const start = await response.json();
  assert.equal(start.status, 'tools');
  const continuation = { turn: start.turn, dataset: body.dataset, results: [result] };
  response = await handle({ request: request('continue', continuation, 'research_sid=11111111-1111-1111-1111-111111111111'), env });
  assert.equal(response.status, 409);

  reply = { content: '查询到20条样本。[R1]' };
  const parallel = await Promise.all([1, 2].map(() => handle({ request: request('continue', continuation, cookie), env })));
  assert.deepEqual(parallel.map(r => r.status).sort(), [200, 409]);
  assert.equal((await parallel.find(r => r.status === 200).json()).status, 'done');
  response = await handle({ request: request('start', { ...body, previous: start.turn, question: '换成杭州' }, cookie), env });
  assert.equal(response.status, 200);
  response = await handle({ request: request('start', { ...body, previous: start.turn, dataset: 'changed' }, cookie), env });
  assert.equal(response.status, 409);
  const persisted = await sql.query('SELECT payload FROM research_turns');
  assert.ok(!JSON.stringify(persisted.rows).includes(key));
});

test('expired turns, unsupported tools and provider errors stay bounded and redacted', async t => {
  const { sql, database } = await setup(t);
  let reply = { tool_calls: [tool], content: null };
  const handle = createResearchHandler({ getDatabase: () => database, fetcher: (...args) => mock(reply)(...args) });
  let response = await handle({ request: request('start', body), env });
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const start = await response.json();
  await sql.query('UPDATE research_turns SET expires=$1 WHERE id=$2', [Date.now() - 1000, start.turn]);
  response = await handle({ request: request('continue', { turn: start.turn, dataset: body.dataset, results: [result] }, cookie), env });
  assert.equal(response.status, 409);
  reply = { tool_calls: [{ ...tool, function: { name: 'delete_all', arguments: '{}' } }] };
  response = await handle({ request: request('start', body, cookie), env });
  assert.equal(response.status, 502);
  const failed = await sql.query("SELECT payload FROM research_turns WHERE status='failed'");
  assert.ok(failed.rows.length > 0);
  assert.equal(failed.rows[0].payload, '{}');
  const failing = createResearchHandler({ getDatabase: () => database,
    fetcher: async () => new Response('PRIVATE PROVIDER CONTENT ' + key, { status: 401 }) });
  response = await failing({ request: request('start', body, cookie), env });
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('PRIVATE'));
});

test('status distinguishes a configured, missing, or uninitialized database without exposing secrets', async t => {
  const { database } = await setup(t);
  const status = () => new Request('https://example.test/api/research/status');
  let handle = createResearchHandler({ getDatabase: () => database });
  let response = await handle({ request: status(), env });
  assert.equal((await response.json()).ready, true);
  handle = createResearchHandler({ getDatabase: () => undefined });
  response = await handle({ request: status(), env });
  assert.equal((await response.json()).ready, false);
  handle = createResearchHandler({ getDatabase: () => ({ ready: async () => { throw new Error('postgresql://user:secret@host/db'); } }) });
  response = await handle({ request: status(), env });
  const text = await response.text();
  assert.match(text, /未初始化/);
  assert.ok(!text.includes('secret'));
  assert.equal(getResearchDatabase(undefined), undefined);
  assert.throws(() => getResearchDatabase('https://example.test'), /PostgreSQL/);
});

test('personal model connection test needs no database and rejects wrong origins and oversized inputs', async () => {
  const handle = createResearchHandler({ getDatabase: () => { throw new Error('Database must not be used'); },
    fetcher: mock({ content: 'OK' }) });
  let response = await handle({ request: request('test', { modelConfig: { apiKey: key, model: 'deepseek-chat' } }), env: {} });
  assert.equal(response.status, 200);
  response = await handle({ request: request('test', { modelConfig: { apiKey: key, model: 'deepseek-chat' } }, '', 'https://evil.test'), env: {} });
  assert.equal(response.status, 403);
  response = await handle({ request: request('test', { padding: 'x'.repeat(56000) }), env: {} });
  assert.equal(response.status, 413);
  response = await handle({ request: new Request('https://example.test/api/research/nope'), env: {} });
  assert.equal(response.status, 404);
});

test('storage translation keeps untrusted values as parameters and rejects unknown statements', async () => {
  const calls = [];
  const database = asResearchDatabase({ async query(text, values) { calls.push({ text, values }); return { rows: [], rowCount: 0 }; } });
  const injected = "'; DROP TABLE research_turns;--";
  await database.prepare('SELECT payload,status FROM research_turns WHERE id=? AND sid=? AND expires>?').bind(injected, 'sid', Date.now()).first();
  assert.ok(!calls[0].text.includes('DROP'));
  assert.equal(calls[0].values[0], injected);
  assert.throws(() => database.prepare('DROP TABLE research_turns'), /Unsupported/);
  assert.throws(() => database.prepare('DELETE FROM research_turns WHERE expires < ?').bind(), /parameters/);
});
