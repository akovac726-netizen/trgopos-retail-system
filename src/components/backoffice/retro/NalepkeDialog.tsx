import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import { generateCenovkePdf, CenovkaItem } from "@/lib/cenovkePdf";
import { fmtSI, setFunkcije, clearFunkcije } from "@/lib/sloFormat";

interface Row { sku?: string; ean: string; name: string; price?: number; old_price?: number | null; description?: string | null; country?: string | null; size_info?: string | null; }
type Mode = 'sifra' | 'ean' | 'ime';
type Oznaka = '' | 'N' | 'P' | 'O' | 'Z';

const MODE_LABEL: Record<Mode, string> = { sifra: 'Koda artikla', ean: 'EAN koda', ime: 'Ime artikla' };
const NEXT_MODE: Record<Mode, Mode> = { sifra: 'ean', ean: 'ime', ime: 'sifra' };

interface QueueRow extends Row { qty: number; }

const NalepkeDialog = ({ onClose, canEditOznaka = false }: { onClose: () => void; canEditOznaka?: boolean }) => {
  const [mode, setMode] = useState<Mode>('sifra');
  const [filter, setFilter] = useState('');
  const [previews, setPreviews] = useState<Row[]>([]); // results after 1× Enter
  const [queue, setQueue] = useState<QueueRow[]>([]); // added after 2× Enter
  const [obmocje, setObmocje] = useState('');
  const [velikost, setVelikost] = useState('H6');
  const [selQueue, setSelQueue] = useState<number | null>(null);
  const [oznake, setOznake] = useState<Record<string, Oznaka>>(() => {
    try { return JSON.parse(localStorage.getItem('product_oznake') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    setFunkcije(`F9 = preklop iskanja (Koda → EAN → Ime) · 1× Enter = prikaži artikel · 2× Enter = dodaj v razpredelnico · Oznake: N novost, P redna, O omejena, Z znižana`);
    return () => clearFunkcije();
  }, []);

  const saveOznake = (next: Record<string, Oznaka>) => {
    setOznake(next);
    try { localStorage.setItem('product_oznake', JSON.stringify(next)); } catch { /* noop */ }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); setMode(m => NEXT_MODE[m]); setFilter(''); setPreviews([]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const search = async () => {
    if (!filter.trim()) { setPreviews([]); return; }
    let q = supabase.from('products').select('sku,ean,name,price').limit(20);
    if (mode === 'ime') q = q.ilike('name', `%${filter}%`);
    else if (mode === 'ean') q = q.ilike('ean', `%${filter}%`);
    else q = q.ilike('sku', `%${filter}%`);
    const { data } = await q;
    setPreviews((data as Row[]) || []);
  };

  const addPreviewToQueue = () => {
    if (previews.length === 0) return;
    // pridejmo prvi rezultat (oz. vse, če je samo en match)
    const r = previews[0];
    setQueue(qs => {
      const key = r.sku || r.ean;
      const idx = qs.findIndex(x => (x.sku || x.ean) === key);
      if (idx >= 0) { const nx = [...qs]; nx[idx] = { ...nx[idx], qty: nx[idx].qty + 1 }; return nx; }
      return [...qs, { ...r, qty: 1 }];
    });
    setFilter(''); setPreviews([]);
  };

  // Enter handler: 1st enter = search, 2nd enter (when previews already shown) = add
  const handleEnter = () => {
    if (previews.length > 0) addPreviewToQueue();
    else search();
  };

  const removeRow = (i: number) => {
    setQueue(qs => qs.filter((_, idx) => idx !== i));
    setSelQueue(null);
  };

  const setOznakaFor = (key: string, val: Oznaka) => {
    const next = { ...oznake, [key]: val };
    if (!val) delete next[key];
    saveOznake(next);
  };

  const tiskaj = () => {
    if (queue.length === 0) { alert('Razpredelnica je prazna. Dodajte artikle z dvakratnim pritiskom Enter.'); return; }
    if (!obmocje) { alert('Vnesite/skenirajte območje.'); return; }
    const items: CenovkaItem[] = queue.map(r => ({
      sku: r.sku, ean: r.ean, name: r.name,
      price: Number(r.price || 0),
      old_price: r.old_price ?? null,
      description: r.description ?? null,
      country: r.country ?? null,
      size_info: r.size_info ?? null,
      quantity: r.qty,
    }));
    try { window.open(generateCenovkePdf(items), '_blank'); }
    catch (e) { alert('Napaka pri generiranju PDF: ' + (e as Error).message); }
  };

  return (
    <RetroWindow title="Nalepke" onClose={onClose} width={680}>
      <div className="mb-2 text-sm font-semibold" style={{ color: '#1a1a1a' }}>Iskanje artikla</div>
      <div className="flex items-center gap-2 mb-2 bg-[#bcd0e6] p-2 border" style={{ borderColor: '#7a8a9a' }}>
        <RetroLabel color="#222">{MODE_LABEL[mode]}:</RetroLabel>
        <RetroInput
          value={filter}
          onChange={e => { setFilter(e.target.value); setPreviews([]); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnter(); } }}
          style={{ flex: 1 }}
          autoFocus
        />
        <RetroButton onClick={search}>Išči</RetroButton>
      </div>

      {/* Preview area – po 1× Enter */}
      <div className="bg-white border mb-2" style={{ borderColor: '#7a8a9a', minHeight: 56 }}>
        {previews.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-4">— prazno (1× Enter za prikaz, 2× Enter za dodajanje v razpredelnico) —</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#e4e8ee] text-left">
                <th className="px-2 py-1">Koda</th>
                <th className="px-2 py-1">Ime artikla</th>
                <th className="px-2 py-1 w-20 text-right">Cena</th>
              </tr>
            </thead>
            <tbody>
              {previews.slice(0, 5).map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#e0e0e0' }}>
                  <td className="px-2 py-1">{r.sku || r.ean}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1 text-right">{fmtSI(Number(r.price || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Razpredelnica artiklov za tisk */}
      <div className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>Razpredelnica nalepk za tisk ({queue.length})</div>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a', minHeight: 160, maxHeight: 220, overflow: 'auto' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr className="bg-[#e4e8ee] text-left">
              <th className="w-7" />
              <th className="px-2 py-1">Koda</th>
              <th className="px-2 py-1">Ime artikla</th>
              <th className="px-2 py-1 w-16 text-right">Cena</th>
              <th className="px-2 py-1 w-14 text-center">Kos</th>
              <th className="px-2 py-1 w-16 text-center">Oznaka</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 && (
              <tr><td colSpan={7} className="px-2 py-6 text-center text-gray-400">— prazno —</td></tr>
            )}
            {queue.map((r, i) => {
              const key = r.sku || r.ean;
              const oz = oznake[key] || '';
              return (
                <tr key={i}
                    className="border-t cursor-pointer"
                    style={{ borderColor: '#e0e0e0', background: selQueue === i ? '#1f4a8a' : 'transparent', color: selQueue === i ? '#fff' : '#111' }}
                    onClick={() => setSelQueue(i)}>
                  <td className="text-center font-bold" style={{ background: '#e4e8ee', color: '#1a3a6a' }}>{selQueue === i ? '▶' : ''}</td>
                  <td className="px-2 py-1">{r.sku || r.ean}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1 text-right">{fmtSI(Number(r.price || 0))}</td>
                  <td className="px-2 py-1 text-center">
                    <input type="number" min={1} value={r.qty} onClick={e => e.stopPropagation()}
                           onChange={e => setQueue(qs => qs.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, parseInt(e.target.value) || 1) } : x))}
                           className="w-12 text-center bg-white text-black border" style={{ borderColor: '#7a8a9a' }} />
                  </td>
                  <td className="px-1 py-0.5 text-center" onClick={e => e.stopPropagation()}>
                    {canEditOznaka ? (
                      <select value={oz} onChange={e => setOznakaFor(key, e.target.value as Oznaka)} className="w-full bg-white text-black text-xs border" style={{ borderColor: '#7a8a9a' }}>
                        <option value="">—</option>
                        <option value="N">N</option>
                        <option value="P">P</option>
                        <option value="O">O</option>
                        <option value="Z">Z</option>
                      </select>
                    ) : (
                      <span className="font-bold">{oz || ''}</span>
                    )}
                  </td>
                  <td className="text-center" onClick={e => { e.stopPropagation(); removeRow(i); }}>
                    <button className="text-red-700 font-bold px-1">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-end justify-between mt-3 gap-3">
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center flex-1 max-w-[340px]">
          <RetroLabel color="#222">Izberi območje:</RetroLabel>
          <RetroInput value={obmocje} onChange={e => setObmocje(e.target.value)} placeholder="Skenirajte kodo območja" />
          <RetroLabel color="#222">Velikost cenovke:</RetroLabel>
          <select value={velikost} onChange={e => setVelikost(e.target.value)} className="px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }}>
            <option value="H6">H6 (7,4 × 5,9 cm)</option>
            <option value="H6A">H6 akcija (7,4 × 5,9 cm)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <RetroButton onClick={() => setQueue([])} disabled={queue.length === 0}>Počisti</RetroButton>
          <RetroButton onClick={tiskaj}>Tiskaj</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
};

export default NalepkeDialog;
