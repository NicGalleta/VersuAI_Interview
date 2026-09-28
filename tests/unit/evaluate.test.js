import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvaluation } from '../../src/features/notco/evaluate.js';

const row = (id, verdict = 'pass') => ({ id, verdict, reason: `Motivo ${id}` });
test('accepts reordered IDs and fenced JSON without assigning by position', () => {
  const data = { results: [row('2', 'fail'), row('1')] };
  assert.deepEqual(
    parseEvaluation('```json\n' + JSON.stringify(data) + '\n```', ['1', '2']),
    data.results,
  );
});
for (const results of [
  [],
  [row('1'), row('1')],
  [row('1'), row('3')],
  [row('1'), row('2', 'yes')],
  [row('1'), { ...row('2'), reason: '' }],
  [row('1'), null],
]) {
  test(`rejects incomplete or malformed batch ${JSON.stringify(results)}`, () => {
    assert.throws(() =>
      parseEvaluation(JSON.stringify({ results }), ['1', '2']),
    );
  });
}
test('rejects non JSON responses', () => {
  assert.throws(() => parseEvaluation('Todo correcto', ['1']), /JSON válido/);
});
