import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { credentialsMatch, issueSession, verifySession } from './session.ts';
import { productSchema } from './productSchema.ts';

const attempts = new Map<string, { count: number; until: number }>();
const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('login'), username: z.string().max(100), password: z.string().max(200) }),
  z.object({ action: z.literal('list'), query: z.string().max(200).default(''), page: z.number().int().nonnegative().default(0) }),
  z.object({ action: z.literal('details'), id: z.string().uuid() }),
  z.object({ action: z.literal('save'), id: z.string().uuid().optional(), product: productSchema }),
  z.object({ action: z.literal('stock'), id: z.string().uuid(), locationId: z.string().uuid(), stock: z.number().int().nonnegative(), minStock: z.number().int().nonnegative() }),
  z.object({ action: z.literal('upload'), extension: z.enum(['jpg', 'jpeg', 'png', 'webp']), size: z.number().positive().max(5 * 1024 * 1024) }),
  z.object({ action: z.literal('image'), id: z.string().uuid(), url: z.string().url().max(2000), primary: z.boolean() }),
  z.object({ action: z.literal('remove-image'), id: z.string().uuid(), imageId: z.string().uuid() }),
]);

Deno.serve(async req => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Neveljavna zahteva.' }, 405);
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Preverite vnesene podatke.' }, 400);
    const body = parsed.data;
    const secret = Deno.env.get('SHOP_SUPPORT_SESSION_SECRET');
    const password = Deno.env.get('SHOP_SUPPORT_PASSWORD');
    if (!secret || !password) return json({ error: 'Prijava še ni nastavljena.' }, 503);
    if (body.action === 'login') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const previous = attempts.get(ip);
      if (previous && previous.until > Date.now() && previous.count >= 5) return json({ error: 'Preveč poskusov. Poskusite čez 15 minut.' }, 429);
      if (!await credentialsMatch(body.username, body.password, password)) {
        const current = previous && previous.until > Date.now() ? previous : { count: 0, until: Date.now() + 15 * 60 * 1000 };
        attempts.set(ip, { ...current, count: current.count + 1 });
        return json({ error: 'Napačno uporabniško ime ali geslo.' }, 401);
      }
      attempts.delete(ip);
      return json({ token: await issueSession(secret) });
    }
    if (!await verifySession(req.headers.get('x-shop-support-session') || '', secret)) return json({ error: 'Seja je potekla. Prijavite se ponovno.' }, 401);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ error: 'Storitev trenutno ni na voljo.' }, 503);
    const db = createClient(url, key);
    const check = (error: { code?: string } | null) => { if (error) throw new Error(error.code === '23505' ? 'EAN ali koda artikla že obstaja.' : 'Podatkov ni bilo mogoče shraniti ali prebrati.'); };
    if (body.action === 'list') {
      let query = db.from('products').select('*', { count: 'exact' }).order('name').range(body.page * 50, body.page * 50 + 49);
      const term = body.query.replace(/[^\p{L}\p{N}\s_-]/gu, '').trim();
      if (term) query = query.or(`name.ilike.%${term}%,ean.ilike.%${term}%,sku.ilike.%${term}%`);
      const { data, error, count } = await query; check(error);
      return json({ products: data, count });
    }
    if (body.action === 'details') {
      const [product, locations, stock, images] = await Promise.all([
        db.from('products').select('*').eq('id', body.id).single(),
        db.from('locations').select('id,name,type').eq('active', true).order('name'),
        db.from('location_stock').select('*').eq('product_id', body.id),
        db.from('product_images').select('*').eq('product_id', body.id).order('sort_order'),
      ]);
      for (const result of [product, locations, stock, images]) check(result.error);
      return json({ product: product.data, locations: locations.data, stocks: stock.data, images: images.data });
    }
    if (body.action === 'save') {
      const result = body.id
        ? await db.from('products').update(body.product).eq('id', body.id).select().single()
        : await db.from('products').insert({ ...body.product, stock: 0 }).select().single();
      check(result.error); return json({ product: result.data });
    }
    if (body.action === 'stock') {
      const existing = await db.from('location_stock').select('id').eq('product_id', body.id).eq('location_id', body.locationId).maybeSingle(); check(existing.error);
      const values = { product_id: body.id, location_id: body.locationId, stock: body.stock, min_stock: body.minStock };
      const result = existing.data ? await db.from('location_stock').update(values).eq('id', existing.data.id) : await db.from('location_stock').insert(values);
      check(result.error); return json({ ok: true });
    }
    if (body.action === 'upload') {
      const path = `support/${crypto.randomUUID()}.${body.extension}`;
      const result = await db.storage.from('product-images').createSignedUploadUrl(path); check(result.error);
      return json({ path, token: result.data?.token, url: db.storage.from('product-images').getPublicUrl(path).data.publicUrl });
    }
    if (body.action === 'image') {
      const allowedPrefix = db.storage.from('product-images').getPublicUrl('support/').data.publicUrl;
      if (!body.url.startsWith(allowedPrefix)) return json({ error: 'Neveljavna slika.' }, 400);
      const result = body.primary ? await db.from('products').update({ image_url: body.url }).eq('id', body.id) : await db.from('product_images').insert({ product_id: body.id, image_url: body.url });
      check(result.error); return json({ ok: true });
    }
    const result = await db.from('product_images').delete().eq('id', body.imageId).eq('product_id', body.id);
    check(result.error); return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? 'Neveljavna zahteva.' : error instanceof Error ? error.message : 'Prišlo je do napake.' }, 400);
  }
});