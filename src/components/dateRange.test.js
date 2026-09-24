import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addMonths, calendarWeeks, formatDate, fromDateKey, getPresets, normalizeRange, sortRange } from './dateRange.js';

test('datas válidas, ano bissexto e virada de ano', () => {
  assert.equal(fromDateKey('2026-02-30'), null);
  assert.equal(fromDateKey('2024-02-29').getDate(), 29);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
});

test('intervalos invertidos são normalizados', () => {
  assert.deepEqual(sortRange('2026-09-10', '2026-08-28'), { start: '2026-08-28', end: '2026-09-10' });
  assert.deepEqual(normalizeRange({ start: '2026-09-10', end: '2026-09-03' }), { start: '2026-09-03', end: '2026-09-10' });
});

test('meses lado a lado usam seis semanas e formato da referência', () => {
  for (const month of ['2026-02-01', '2026-08-01', '2026-09-01', '2026-10-01']) {
    const weeks = calendarWeeks(month, 6);
    assert.equal(weeks.length, 6);
    assert.equal(weeks.flat().length, 42);
    assert.equal(fromDateKey(weeks[0][0]).getDay(), 0);
    assert.equal(fromDateKey(weeks.at(-1).at(-1)).getDay(), 6);
  }
  assert.equal(formatDate('2026-09-01', 'calendar-month'), '2026 set');
});

test('atalhos Hoje, 7, 15, 30 dias e Este ano incluem hoje', () => {
  const presets = getPresets('2026-09-11');
  assert.equal(presets[0].label, 'Hoje');
  assert.equal(presets[0].start, '2026-09-11');
  assert.deepEqual(presets.slice(1, 4).map(({ start, end }) => [start, end]), [
    ['2026-09-05', '2026-09-11'], ['2026-08-28', '2026-09-11'], ['2026-08-13', '2026-09-11'],
  ]);
  assert.equal(presets[4].label, 'Este ano');
  assert.equal(presets[4].start, '2026-01-01');
  assert.equal(presets[4].end, '2026-09-11');
  assert.equal(getPresets('2027-01-01')[4].start, '2027-01-01');
});
