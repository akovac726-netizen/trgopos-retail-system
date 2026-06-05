import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput } from "./RetroWindow";

interface Row {
  product_id: string;
  ean: string;
  sku: string | null;
  name: string;
  location_id: string;
  location: string;
  stock: number;
}

const SkladiscaTrgovinDialog = ({ onClose }: { onClose: () => void }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  const [locFilter, setLocFilter] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: stocks } = await supabase
        .from('location_stock')
        .select('stock, location_id, product_id, locations:locations!inner(id,name,type), products:products!inner(id,ean,sku,name)')
        .gt('stock', 0);
      if (!stocks) return;
      const filtered = (stocks as any[])
        .filter(r => r.locations?.type === 'pe')
        .map(r => ({
          product_id: r.products.id,
          ean: r.products.ean,
          sku: r.products.sku,
          name: r.products.name,
          location_id: r.locations.id,
          location: r.locations.name,
          stock: Number(r.stock),
        } as Row));
      setRows(filtered);
    })();
  }, []);

  const locOptions = Array.from(new Set(rows.map(r => r.location))).sort();
  const visible = rows.filter(r =>
    (!locFilter || r.location === locFilter) &&
    (!filter || r.name.toLowerCase().includes(filter.toLowerCase()) || r.ean.includes(filter) || (r.sku || '').includes(filter))
  );

  return (
    <RetroWindow title="Skladišča trgovin" onClose={onClose} width={760}>
      <div className="flex gap-3 mb-3 items-center">
        <span className="text-sm font-semibold" style={{ color: '#1a3a6a' }}>Trgovina:</span>
        <select value={locFilter} onChange={e => setLocFilter(e.target.value)} className="px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }}>
          <option value="">— vse —</option>
          {locOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-sm font-semibold ml-3" style={{ color: '#1a3a6a' }}>Iskanje:</span>
        <RetroInput value={filter} onChange={e => setFilter(e.target.value)} placeholder="EAN / šifra / naziv" className="!w-72" />
      </div>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-[#a8c0d8] text-white text-left">
                <th className="px-2 py-1">Trgovina</th>
                <th className="px-2 py-1">EAN</th>
                <th className="px-2 py-1">Šifra</th>
                <th className="px-2 py-1">Naziv</th>
                <th className="px-2 py-1 text-right">Zaloga</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#e0e0e0' }}>
                  <td className="px-2 py-1">{r.location}</td>
                  <td className="px-2 py-1">{r.ean}</td>
                  <td className="px-2 py-1">{r.sku || '—'}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1 text-right font-bold">{r.stock}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">Brez podatkov.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 text-sm">
        <div>Vrstic: <b>{visible.length}</b></div>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default SkladiscaTrgovinDialog;
