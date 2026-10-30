export const SUPPORT_USERNAME = 'podpora';
export const SESSION_DURATION_MS = 30 * 60 * 1000;

const encoder = new TextEncoder();
async function signingKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = (text: string) => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));

export async function credentialsMatch(username: string, password: string, expected: string) {
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  const [a, b] = await Promise.all([digest(password), digest(expected)]);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return username === SUPPORT_USERNAME && mismatch === 0;
}

export async function issueSession(secret: string, now = Date.now()) {
  const payload = encode(encoder.encode(JSON.stringify({ scope: 'shop-products', exp: now + SESSION_DURATION_MS, nonce: crypto.randomUUID() })));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifySession(token: string, secret: string, now = Date.now()) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!await crypto.subtle.verify('HMAC', await signingKey(secret), decode(signature), encoder.encode(payload))) return false;
    const data = JSON.parse(new TextDecoder().decode(decode(payload)));
    return data.scope === 'shop-products' && typeof data.exp === 'number' && data.exp > now;
  } catch { return false; }
}