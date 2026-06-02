import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";

interface Row { sku?: string; ean: string; name: string; }

const NalepkeDialog = ({ onClose }: { onClose: () => void }) => {
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [obmocje, setObmocje] = useState('');
  const [velikost, setVelikost] = useState('');
  const [selected, setSelected] = useState<number>(-1);

  useEffect(() => {
    supabase.from('products').select('sku,ean,name').limit(15).then(({ data }) => setRows((data as Row[]) || []));
  }, []);

  const filtered = rows.filter(r =>
    !filter || r.name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.sku || '').includes(filter) || r.ean.includes(filter)
  );

  return (
    <RetroWindow title="Nalepke" onClose={onClose} width={620}>
      <div className="flex items-center gap-3 mb-3">
        <RetroLabel>Iskanje artikla:</RetroLabel>
        <RetroInput
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Ime artikla / Šifra artikla / EAN artikla"
          style={{ width: 320 }}
        />
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
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="px-2 py-3 text-center text-gray-500">Ni podatkov</td></tr>
            )}
            {filtered.map((r, i) => (
              <tr key={i} className={`border-t cursor-pointer ${selected === i ? 'bg-blue-100' : 'hover:bg-blue-50'}`} style={{ borderColor: '#e0e0e0' }} onClick={() => setSelected(i)}>
                <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">{selected === i ? '▶' : ''}</td>
                <td className="px-2 py-1">{r.sku || r.ean}</td>
                <td className="px-2 py-1">{r.name}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - filtered.length) }).map((_, i) => (
              <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                <td className="bg-[#e4e8ee]" /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-3 border-t" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
      </div>
      <div className="flex items-end justify-between mt-4 gap-3">
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center flex-1 max-w-[320px]">
          <RetroLabel color="#222">Izberi območje:</RetroLabel>
          <select value={obmocje} onChange={e => setObmocje(e.target.value)} className="px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }}>
            <option value="">—</option>
            <option>Trgovina A</option>
            <option>Trgovina B</option>
            <option>Skladišče</option>
          </select>
          <RetroLabel color="#222">Velikost cenovke:</RetroLabel>
          <select value={velikost} onChange={e => setVelikost(e.target.value)} className="px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }}>
            <option value="">—</option>
            <option>S (40×25 mm)</option>
            <option>M (60×40 mm)</option>
            <option>L (100×60 mm)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <RetroButton onClick={() => {
            if (selected < 0) { alert('Izberite artikel.'); return; }
            if (!obmocje || !velikost) { alert('Izberite območje in velikost.'); return; }
            window.print();
          }}>Tiskaj</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
};

export default NalepkeDialog;
