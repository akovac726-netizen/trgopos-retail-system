import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('administrator uses the requested username on both login screens', () => {
  const login = readFileSync(new URL('./LoginScreen.tsx', import.meta.url), 'utf8');
  const backend = readFileSync(new URL('../backoffice/BackOfficeDashboard.tsx', import.meta.url), 'utf8');
  assert.ok(login.includes("username === 'podporaS'"));
  assert.ok(backend.includes("backendUsername === 'podporaS'"));
  for (const source of [login, backend]) {
    assert.doesNotMatch(source, /(?:username|backendUsername) === '(?:StBy-core|BB\.admin|SB-admin)'/);
  }
});