import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';

test('administrator uses the requested username on both login screens', () => {
  const login = readFileSync(new URL('./LoginScreen.tsx', import.meta.url), 'utf8');
  const backend = readFileSync(new URL('../backoffice/BackOfficeDashboard.tsx', import.meta.url), 'utf8');
  expect(login).toContain("username === 'podporaS'");
  expect(backend).toContain("backendUsername === 'podporaS'");
  for (const source of [login, backend]) {
    expect(source).not.toMatch(/(?:username|backendUsername) === '(?:StBy-core|BB\.admin|SB-admin)'/);
  }
});