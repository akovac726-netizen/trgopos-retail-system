import { test } from 'node:test';
import assert from 'node:assert/strict';
import { credentialsMatch, issueSession, verifySession, SESSION_DURATION_MS } from '../../../supabase/functions/shop-support/session.ts';
import { parseSupportNumber, productPayload } from './shopSupportFields.ts';

test('support username is podpora and server password is required', async () => {
  const password = crypto.randomUUID();
  assert.equal(await credentialsMatch('podpora', password, password), true);
  assert.equal(await credentialsMatch('podporaS', password, password), false);
  assert.equal(await credentialsMatch('podpora', 'incorrect', password), false);
});
test('product access rejects forged and expired sessions', async () => {
  const secret = crypto.randomUUID();
  const token = await issueSession(secret, 1000);
  assert.equal(await verifySession(token, secret, 1001), true);
  assert.equal(await verifySession(`${token}modified`, secret, 1001), false);
  assert.equal(await verifySession(token, secret, 1000 + SESSION_DURATION_MS), false);
  assert.equal(await verifySession(token, crypto.randomUUID(), 1001), false);
});
test('BackOffice amounts use decimal comma with thousands separator', () => {
  assert.equal(parseSupportNumber('2.360,77'), 2360.77);
  assert.throws(() => parseSupportNumber('2360.77'));
});
test('product editing cannot merge or replace location stock', () => {
  const payload = productPayload({ name: 'Artikel', ean: '123', stock: '99' });
  assert.equal('stock' in payload, false);
});