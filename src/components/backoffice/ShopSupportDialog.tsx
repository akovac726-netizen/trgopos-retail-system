import { useState } from 'react';
import { LogOut, Plus, Save, Search, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RetroWindow from './retro/RetroWindow';
import { formatSupportNumber, numberFields, parseSupportNumber, productPayload, SupportProduct, textFields } from './shopSupportFields';

type Location = { id: string; name: string; type: string };
type Stock = { location_id: string; stock: number; min_stock: number };
type Image = { id: string; image_url: string };
const inputClass = 'w-full min-w-0 rounded-sm border border-input bg-background px-2 py-1 text-sm text-foreground';

export default function ShopSupportDialog({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<SupportProduct[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [editing, setEditing] = useState<SupportProduct | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'podatki' | 'slike' | 'zaloga'>('podatki');
  const [locations, setLocations] = useState<Location[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [images, setImages] = useState<Image[]>([]);

  async function invoke(body: Record<string, unknown>, session = token) {
    const result = await supabase.functions.invoke('shop-support', { body, headers: session ? { 'x-shop-support-session': session } : {} });
    if (result.error) {
      let message = 'Storitev trenutno ni na voljo.';
      const response = result.error.context;
      if (response instanceof Response) {
        const data = await response.json().catch(() => null);
        message = data?.error || message;
        if (response.status === 401 && body.action !== 'login') { setToken(''); setEditing(null); }
      }
      throw new Error(message);
    }
    if (result.data?.error) throw new Error(result.data.error);
    return result.data;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Prišlo je do napake.'); }
    finally { setBusy(false); }
  }
  async function load(session = token, nextPage = page) {
    const data = await invoke({ action: 'list', query, page: nextPage }, session);
    setProducts(data.products); setCount(data.count || 0); setPage(nextPage);
  }
  function fill(product: SupportProduct) {
    setEditing(product);
    const next: Record<string, string> = {};
    for (const [key] of textFields) next[key] = String(product[key] ?? '');
    for (const [key] of numberFields) next[key] = formatSupportNumber(Number(product[key] ?? 0));
    next.description = String(product.description || ''); next.currency = String(product.currency || 'EUR'); next.image_url = String(product.image_url || '');
    setValues(next);
  }
  async function details(id: string) {
    const data = await invoke({ action: 'details', id });
    fill(data.product); setLocations(data.locations); setStocks(data.stocks); setImages(data.images);
  }
  const setValue = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  async function upload(file: File, primary: boolean) {
    if (!editing?.id) throw new Error('Najprej shranite artikel.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Izberite JPG, PNG ali WebP sliko.');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const data = await invoke({ action: 'upload', extension, size: file.size });
    const result = await supabase.storage.from('product-images').uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
    if (result.error) throw new Error('Slike ni bilo mogoče naložiti.');
    await invoke({ action: 'image', id: editing.id, url: data.url, primary });
    await details(editing.id); toast.success('Slika shranjena.');
  }

  return <RetroWindow title="BackOffice Trgovine" width={680} onClose={onClose}>
    <div className="font-backoffice min-w-0 text-foreground">
      {!token ? <form className="mx-auto flex max-w-sm flex-col gap-3" onSubmit={e => { e.preventDefault(); void run(async () => {
        const data = await invoke({ action: 'login', username, password }); setPassword('');
        await load(data.token, 0); setToken(data.token);
      }); }}>
        <label className="text-sm">Uporabniško ime<input aria-label="Uporabniško ime za BackOffice Trgovine" autoComplete="username" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} maxLength={100} /></label>
        <label className="text-sm">Geslo<input aria-label="Geslo za BackOffice Trgovine" autoComplete="current-password" type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} maxLength={200} /></label>
        <Button type="submit" disabled={busy || !username || !password}>Prijava</Button>
      </form> : <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <strong>{editing ? 'Kartica artikla' : 'Artikli'}</strong>
          <Button variant="outline" size="sm" onClick={() => { setToken(''); setPassword(''); setEditing(null); setProducts([]); }}><LogOut />Odjava</Button>
        </div>
        {!editing ? <>
          <form className="mb-3 flex gap-2" onSubmit={e => { e.preventDefault(); void run(() => load(token, 0)); }}>
            <input aria-label="Iskanje artiklov" placeholder="Koda artikla / EAN / ime" className={inputClass} value={query} onChange={e => setQuery(e.target.value)} />
            <Button type="submit" variant="outline" size="icon" title="Iskanje" disabled={busy}><Search /></Button>
            <Button type="button" variant="outline" size="icon" title="Dodaj artikel" disabled={busy} onClick={() => { fill({ id: '', ean: '', name: '', unit: 'kos', currency: 'EUR', category: 'Ostalo', vat_rate: 22, package_qty: 1 }); setTab('podatki'); setImages([]); setStocks([]); }}><Plus /></Button>
          </form>
          <div className="max-h-72 overflow-auto border border-border bg-background">
            <table className="w-full table-fixed text-left text-sm"><thead className="sticky top-0 bg-secondary"><tr><th className="w-28 p-2">Koda artikla</th><th className="p-2">Ime artikla</th><th className="w-24 p-2 text-right">Cena</th></tr></thead><tbody>
              {products.map(p => <tr key={p.id} className="border-t border-border"><td className="truncate p-2">{p.sku}</td><td className="p-2"><Button variant="link" className="h-auto w-full justify-start whitespace-normal p-0 text-left" disabled={busy} onClick={() => { setTab('podatki'); void run(() => details(p.id)); }}>{p.name}</Button></td><td className="p-2 text-right">{formatSupportNumber(Number(p.price))} €</td></tr>)}
            </tbody></table>
            {!products.length && <p className="p-4 text-center text-sm text-muted-foreground">Ni artiklov.</p>}
          </div>
          <div className="mt-2 flex items-center justify-between text-sm"><Button variant="outline" size="sm" disabled={busy || page === 0} onClick={() => void run(() => load(token, page - 1))}>Prejšnja</Button><span>{count} artiklov · {page + 1}</span><Button variant="outline" size="sm" disabled={busy || (page + 1) * 50 >= count} onClick={() => void run(() => load(token, page + 1))}>Naslednja</Button></div>
        </> : <>
          <div className="mb-3 flex flex-wrap gap-1" role="tablist">
            {(['podatki', 'slike', 'zaloga'] as const).map(t => <Button key={t} role="tab" aria-selected={tab === t} size="sm" variant={tab === t ? 'default' : 'outline'} disabled={!editing.id && t !== 'podatki'} onClick={() => setTab(t)}>{t === 'podatki' ? 'Podatki' : t === 'slike' ? 'Slike' : 'Zaloga po lokacijah'}</Button>)}
          </div>
          <div className="max-h-[48vh] min-h-0 overflow-auto">
            {tab === 'podatki' && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {textFields.map(([key, label]) => <label className="min-w-0 text-sm" key={key}>{label}<input className={inputClass} value={values[key] || ''} onChange={e => setValue(key, e.target.value)} maxLength={key === 'name' ? 255 : 2000} /></label>)}
              {numberFields.map(([key, label]) => <label className="min-w-0 text-sm" key={key}>{label}<input className={inputClass} inputMode="decimal" value={values[key] || ''} onChange={e => setValue(key, e.target.value)} /></label>)}
              <label className="text-sm">Valuta<input className={inputClass} maxLength={3} value={values.currency || ''} onChange={e => setValue('currency', e.target.value.toUpperCase())} /></label>
              <label className="text-sm sm:col-span-2">Opis<textarea className={inputClass} rows={3} maxLength={2000} value={values.description || ''} onChange={e => setValue('description', e.target.value)} /></label>
            </div>}
            {tab === 'slike' && <>
              <div className="mb-3 flex flex-wrap gap-2">{[true, false].map(primary => <Button key={String(primary)} asChild variant="outline" size="sm" disabled={busy}><label className="cursor-pointer"><Upload />{primary ? 'Glavna slika' : 'Dodaj sliko'}<input aria-label={primary ? 'Naloži glavno sliko' : 'Naloži dodatno sliko'} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void run(() => upload(file, primary)); e.target.value = ''; }} /></label></Button>)}</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{values.image_url && <figure><img src={values.image_url} alt="Glavna slika artikla" className="h-28 w-full object-contain" /><figcaption className="text-center text-xs">Glavna slika</figcaption></figure>}{images.map(image => <figure key={image.id}><img src={image.image_url} alt="Slika artikla" className="h-28 w-full object-contain" /><Button variant="ghost" size="sm" title="Odstrani sliko" disabled={busy} onClick={() => void run(async () => { await invoke({ action: 'remove-image', id: editing.id, imageId: image.id }); await details(editing.id); })}><X />Odstrani</Button></figure>)}</div>
            </>}
            {tab === 'zaloga' && locations.map(location => { const stock = stocks.find(s => s.location_id === location.id); return <form key={location.id} className="mb-3 grid grid-cols-2 gap-2 border-b border-border pb-3" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void run(async () => { await invoke({ action: 'stock', id: editing.id, locationId: location.id, stock: parseSupportNumber(String(data.get('stock'))), minStock: parseSupportNumber(String(data.get('minStock'))) }); await details(editing.id); toast.success('Zaloga shranjena.'); }); }}>
              <strong className="col-span-2 text-sm">{location.name}</strong>
              <label className="text-sm">Zaloga<input key={`${stock?.stock}`} name="stock" aria-label={`Zaloga ${location.name}`} className={inputClass} defaultValue={stock?.stock ?? 0} inputMode="numeric" /></label>
              <label className="text-sm">Minimalna zaloga<input key={`${stock?.min_stock}`} name="minStock" className={inputClass} defaultValue={stock?.min_stock ?? 0} inputMode="numeric" /></label>
              <Button className="col-span-2 justify-self-end" variant="outline" size="sm" type="submit" disabled={busy}><Save />Shrani zalogo</Button>
            </form>; })}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void run(async () => { await load(); setEditing(null); })}>Nazaj</Button>
            {tab === 'podatki' && <Button size="sm" disabled={busy} onClick={() => void run(async () => {
              const product = productPayload(values); if (!product.name || !product.ean) throw new Error('Ime in EAN sta obvezna.');
              const data = await invoke({ action: 'save', ...(editing.id ? { id: editing.id } : {}), product }); await details(data.product.id); toast.success('Artikel shranjen.');
            })}><Save />Shrani</Button>}
          </div>
        </>}
      </>}
      {error && <p role="alert" className="mt-3 break-words text-sm text-destructive">{error}</p>}
      {busy && <p role="status" className="mt-2 text-sm text-muted-foreground">Obdelava …</p>}
    </div>
  </RetroWindow>;
}