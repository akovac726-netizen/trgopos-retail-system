import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import { generateCenovkePdf, CenovkaItem } from "@/lib/cenovkePdf";

interface Row { sku?: string; ean: string; name: string; price?: number; old_price?: number | null; description?: string | null; country?: string | null; size_info?: string | null; }

const NalepkeDialog = ({ onClose }: { onClose: () => void }) => {
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [obmocje, setObmocje] = useState('');
  const [velikost, setVelikost] = useState('H6');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    supabase.from('products').select('sku,ean,name,price').limit(20).then(({ data }) => setRows((data as Row[]) || []));
  }, []);

  const search = async () => {
    let q = supabase.from('products').select('sku,ean,name,price').limit(50);
    if (filter) q = q.or(`name.ilike.%${filter}%,sku.ilike.%${filter}%,ean.ilike.%${filter}%`);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setSelected(new Set());
  };

  const toggleSel = (i: number) => {
    const n = new Set(selected);
    if (n.has(i)) n.delete(i); else n.add(i);
    setSelected(n);
  };

  const tiskaj = () => {
    if (selected.size === 0) { alert('Izberite artikel (klik na vrstico).'); return; }
    if (!obmocje) { alert('Vnesite/skenirajte območje.'); return; }
    if (!velikost) { alert('Izberite velikost cenovke.'); return; }
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
    try {
      const url = generateCenovkePdf(items);
      window.open(url, '_blank');
    } catch (e) {
      alert('Napaka pri generiranju PDF: ' + (e as Error).message);
    }
  };

  return (
    <RetroWindow title="Nalepke" onClose={onClose} width={620}>
      <div className="flex items-center gap-3 mb-3">
        <RetroLabel>Iskanje artikla:</RetroLabel>
        <RetroInput
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Ime artikla / Šifra artikla / EAN artikla"
          style={{ width: 320 }}
        />
        <RetroButton onClick={search}>Išči</RetroButton>
      </div>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
        <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#e4e8ee] text-left">
              <th className="w-8" />
              <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Koda</th>
              <th className="px-2 py-1">Ime artikla</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-2 py-3 text-center text-gray-500">Ni podatkov</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}
                  className={`border-t cursor-pointer ${selected.has(i) ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  style={{ borderColor: '#e0e0e0' }}
                  onClick={() => toggleSel(i)}>
                <td className="text-center bg-[#e4e8ee] text-[#1a3a6a] font-bold">{selected.has(i) ? '▶' : ''}</td>
                <td className="px-2 py-1">{r.sku || r.ean}</td>
                <td className="px-2 py-1">{r.name}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - rows.length) }).map((_, i) => (
              <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                <td className="bg-[#e4e8ee]" /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-3 border-t" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
      </div>
      <div className="flex items-end justify-between mt-4 gap-3">
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center flex-1 max-w-[340px]">
          <RetroLabel color="#222">Izberi območje:</RetroLabel>
          <RetroInput
            value={obmocje}
            onChange={e => setObmocje(e.target.value)}
            placeholder="Skenirajte kodo območja"
          />
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
    </RetroWindow>
  );
};

export default NalepkeDialog;
