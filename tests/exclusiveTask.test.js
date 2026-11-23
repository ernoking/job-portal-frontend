import test from 'node:test';
import assert from 'node:assert/strict';
import { createExclusiveTask } from '../src/utils/exclusiveTask.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test('pending saved-document retrieval prevents generation and a stale overwrite', async () => {
  const run = createExclusiveTask();
  const history = deferred();
  let displayed, generations = 0;
  const loading = run(async () => { await history.promise; displayed = 'saved'; });
  assert.equal(await run(async () => { generations++; displayed = 'new'; }), false);
  assert.equal(generations, 0);
  history.resolve();
  await loading;
  assert.equal(displayed, 'saved');
  assert.equal(await run(async () => { generations++; displayed = 'new'; }), true);
  assert.equal(displayed, 'new');
});

test('pending generation blocks history retry and version switching without queuing them', async () => {
  const run = createExclusiveTask();
  const generation = deferred();
  let displayed, reads = 0;
  const generating = run(async () => { await generation.promise; displayed = 'new'; });
  const readOld = async () => { reads++; displayed = 'old'; };
  assert.equal(await run(readOld), false);
  assert.equal(await run(readOld), false);
  generation.resolve();
  await generating;
  assert.equal(displayed, 'new');
  assert.equal(reads, 0);
});

test('lock is released after failure and synchronously excludes same-tick double clicks', async () => {
  const run = createExclusiveTask();
  await assert.rejects(run(async () => { throw new Error('503'); }), /503/);
  const wait = deferred();
  let calls = 0;
  const first = run(async () => { calls++; await wait.promise; });
  const second = run(async () => { calls++; });
  assert.equal(await second, false);
  wait.resolve();
  assert.equal(await first, true);
  assert.equal(calls, 1);
  assert.equal(await run(async () => { calls++; }), true);
  assert.equal(calls, 2);
});
