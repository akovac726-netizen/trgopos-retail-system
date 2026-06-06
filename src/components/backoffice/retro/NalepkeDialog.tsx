import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import { generateCenovkePdf, CenovkaItem } from "@/lib/cenovkePdf";

interface Row { sku?: string; ean: string; name: string; price?: number; old_price?: number | null; description?: string | null; country?: string | null; size_info?: string | null; }
type Mode = 'sifra' | 'ean' | 'ime';
type Oznaka = '' | 'N' | 'P' | 'O' | 'Z';

const MODE_LABEL: Record<Mode, string> = { sifra: 'Koda artikla', ean: 'EAN koda', ime: 'Ime artikla' };
const NEXT_MODE: Record<Mode, Mode> = { sifra: 'ean', ean: 'ime', ime: 'sifra' };

const NalepkeDialog = ({ onClose, canEditOznaka = false }: { onClose: () => void; canEditOznaka?: boolean }) => {
  const [mode, setMode] = useState<Mode>('sifra');
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [obmocje, setObmocje] = useState('');
  const [velikost, setVelikost] = useState('H6');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [oznake, setOznake] = useState<Record<string, Oznaka>>(() => {
    try { return JSON.parse(localStorage.getItem('product_oznake') || '{}'); } catch { return {}; }
  });

  const saveOznake = (next: Record<string, Oznaka>) => {
    setOznake(next);
    try { localStorage.setItem('product_oznake', JSON.stringify(next)); } catch { /* noop */ }
  };

  // F9 toggles between modes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        setMode(m => NEXT_MODE[m]);
        setFilter('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const search = async () => {
    if (!filter.trim()) { setRows([]); setSelected(new Set()); return; }
    let q = supabase.from('products').select('sku,ean,name,price').limit(50);
    if (mode === 'ime') q = q.ilike('name', `%${filter}%`);
    else if (mode === 'ean') q = q.ilike('ean', `%${filter}%`);
    else q = q.ilike('sku', `%${filter}%`);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setSelected(new Set());
  };

  const toggleSel = (i: number) => {
    const n = new Set(selected);
    if (n.has(i)) n.delete(i); else n.add(i);
    setSelected(n);
  };

  const setOznakaFor = (key: string, val: Oznaka) => {
    const next = { ...oznake, [key]: val };
    if (!val) delete next[key];
    saveOznake(next);
  };

  const tiskaj = () => {
    if (selected.size === 0) { alert('Izberite artikel (klik na vrstico).'); return; }
    if (!obmocje) { alert('Vnesite/skenirajte območje.'); return; }
    const items: CenovkaItem[] = Array.from(selected).map(i => {
      const r = rows[i];
      return {
        sku: r.sku, ean: r.ean, name: r.name,
        price: Number(r.price || 0),
        old_price: r.old_price ?? null,
        description: r.description ?? null,
        country: r.country ?? null,
        size_info: r.size_info ?? null,
        quantity: 1,
      };
    });
    try { window.open(generateCenovkePdf(items), '_blank'); }
    catch (e) { alert('Napaka pri generiranju PDF: ' + (e as Error).message); }
  };

  return (
    <RetroWindow title="Nalepke" onClose={onClose} width={640}>
      <div className="mb-2 text-sm font-semibold" style={{ color: '#1a1a1a' }}>Iskanje artikla</div>
      <div className="flex items-center gap-2 mb-3 bg-[#bcd0e6] p-2 border" style={{ borderColor: '#7a8a9a' }}>
        <RetroLabel color="#222">{MODE_LABEL[mode]}:</RetroLabel>
        <RetroInput
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') search(); }}
          style={{ flex: 1 }}
          autoFocus
        />
        <RetroButton onClick={search}>Išči</RetroButton>
      </div>
      <div className="text-[11px] mb-1" style={{ color: '#1a3a6a' }}>
        F9 = preklop iskanja (Koda → EAN → Ime)
      </div>

      <div className="bg-white border" style={{ borderColor: '#7a8a9a', minHeight: 240, maxHeight: 280, overflow: 'auto' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr className="bg-[#e4e8ee] text-left">
              <th className="w-7" />
              <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Koda</th>
              <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Ime artikla</th>
              <th className="px-2 py-1 border-r w-16 text-right" style={{ borderColor: '#c8c8c8' }}>Cena</th>
              <th className="px-2 py-1 w-16 text-center">Oznaka</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-gray-400">— prazno —</td></tr>
            )}
            {rows.map((r, i) => {
              const key = r.sku || r.ean;
              const oz = oznake[key] || '';
              return (
                <tr key={i}
                    className="border-t cursor-pointer"
                    style={{ borderColor: '#e0e0e0', background: selected.has(i) ? '#1f4a8a' : 'transparent', color: selected.has(i) ? '#fff' : '#111' }}
                    onClick={() => toggleSel(i)}>
                  <td className="text-center font-bold" style={{ background: '#e4e8ee', color: '#1a3a6a' }}>{selected.has(i) ? '▶' : ''}</td>
                  <td className="px-2 py-1">{r.sku || r.ean}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1 text-right">{Number(r.price || 0).toFixed(2)}</td>
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
          <RetroButton onClick={tiskaj}>Tiskaj</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </div>
      <div className="text-[10px] mt-1 text-center" style={{ color: '#444' }}>
        Oznake: N – novost · P – redna ponudba · O – omejena ponudba · Z – znižana ponudba
      </div>
    </RetroWindow>
  );
};

export default NalepkeDialog;
