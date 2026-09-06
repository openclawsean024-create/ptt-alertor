/**
 * Unit tests for lib/keywords.ts
 *
 * v3.0.2 fleet alignment (2026-09-06 by Sean 10-repo-fleet):
 *   - Run with `node --import tsx --test tests/keywords.test.ts`
 *   - No external test framework (zero new deps)
 *   - Covers AND/OR logic, empty input, single keyword, parseNotificationSettings
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchKeywords, parseNotificationSettings, type KeywordRule } from '../lib/keywords';

test('matchKeywords — empty input returns no match', () => {
  const r = matchKeywords('台積電 熊本廠', []);
  assert.equal(r.matched, false);
  assert.deepEqual(r.matchedKeywords, []);
});

test('matchKeywords — single keyword matches case-insensitively', () => {
  const rules: KeywordRule[] = [{ text: 'TSMC', logic: 'AND' }];
  const r = matchKeywords('TSMC announces Kumamoto fab', rules);
  assert.equal(r.matched, true);
  assert.deepEqual(r.matchedKeywords, ['TSMC']);
});

test('matchKeywords — whitespace-only keyword filtered out', () => {
  const rules: KeywordRule[] = [
    { text: '   ', logic: 'AND' },
    { text: 'TSMC', logic: 'AND' },
  ];
  const r = matchKeywords('TSMC news', rules);
  assert.equal(r.matched, true);
  assert.deepEqual(r.matchedKeywords, ['TSMC']);
});

test('matchKeywords — OR logic: any keyword matches', () => {
  const rules: KeywordRule[] = [
    { text: 'TSMC', logic: 'AND' },
    { text: 'Kumamoto', logic: 'OR' },
  ];
  // Title has Kumamoto (OR) but not TSMC (AND) — overallMatched: first fails, but OR lifts to true
  const r = matchKeywords('Kumamoto factory update', rules);
  assert.equal(r.matched, true);
  assert.ok(r.matchedKeywords.includes('Kumamoto'));
});

test('matchKeywords — AND logic: all keywords must match', () => {
  const rules: KeywordRule[] = [
    { text: 'TSMC', logic: 'AND' },
    { text: 'Kumamoto', logic: 'AND' },
  ];
  const r1 = matchKeywords('TSMC Kumamoto fab news', rules);
  assert.equal(r1.matched, true);
  assert.ok(r1.matchedKeywords.includes('TSMC'));
  assert.ok(r1.matchedKeywords.includes('Kumamoto'));

  // Missing one AND keyword → no match
  const r2 = matchKeywords('TSMC Tokyo expansion', rules);
  assert.equal(r2.matched, false);
});

test('parseNotificationSettings — null/undefined input returns defaults', () => {
  assert.deepEqual(parseNotificationSettings(null), {
    notify_line: false,
    notify_email: true,
    notify_discord: false,
  });
  assert.deepEqual(parseNotificationSettings(undefined), {
    notify_line: false,
    notify_email: true,
    notify_discord: false,
  });
});

test('parseNotificationSettings — object input parses correctly', () => {
  const r = parseNotificationSettings({
    notify_line: true,
    notify_email: false,
    notify_discord: true,
    line_token: 'tok-123',
    email: 'user@example.com',
    discord_webhook: 'https://discord.com/api/webhooks/abc',
  });
  assert.equal(r.notify_line, true);
  assert.equal(r.notify_email, false);
  assert.equal(r.notify_discord, true);
  assert.equal(r.line_token, 'tok-123');
  assert.equal(r.email, 'user@example.com');
  assert.equal(r.discord_webhook, 'https://discord.com/api/webhooks/abc');
});

test('parseNotificationSettings — string input returns defaults', () => {
  // Defensive: should not crash on bad input
  const r = parseNotificationSettings('not-an-object');
  assert.deepEqual(r, {
    notify_line: false,
    notify_email: true,
    notify_discord: false,
  });
});
