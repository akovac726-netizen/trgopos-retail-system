import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import DocumentDialog, { DocMode } from "./DocumentDialog";

type SearchMode = 'stevilka' | 'datum';
const MODE_LABEL: Record<SearchMode, string> = { stevilka: 'Št. dokumenta', datum: 'Datum dok.' };
const NEXT: Record<SearchMode, SearchMode> = { stevilka: 'datum', datum: 'stevilka' };

interface DocRow { id: string; document_number: string; date: string; supplier: string; total: number; status: string; }

const DokumentiListDialog = ({ mode, onClose }: { mode: DocMode; onClose: () => void }) => {
  const [searchMode, setSearchMode] = useState<SearchMode>('stevilka');
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<DocRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); setSearchMode(s => NEXT[s]); setFilter(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const search = async () => {
    if (mode === 'prevzem') {
      let q = supabase.from('prevzemnice').select('id,document_number,date_prevzem,supplier,total,status').order('created_at', { ascending: false }).limit(80);
      if (filter && searchMode === 'stevilka') q = q.ilike('document_number', `%${filter}%`);
      if (filter && searchMode === 'datum') q = q.eq('date_prevzem', filter);
      const { data } = await q;
      setRows((data || []).map((d: any) => ({ id: d.id, document_number: d.document_number, date: d.date_prevzem, supplier: d.supplier, total: Number(d.total || 0), status: d.status })));
    } else if (mode === 'narocilo') {
      let q = supabase.from('orders').select('id,supplier,date,items,status,note').order('created_at', { ascending: false }).limit(80);
      if (filter && searchMode === 'stevilka') q = q.ilike('note', `%${filter}%`);
      if (filter && searchMode === 'datum') q = q.eq('date', filter);
      const { data } = await q;
      setRows((data || []).map((d: any) => ({ id: d.id, document_number: (d.note || '').match(/(\d{6})/)?.[1] || d.id.slice(0, 6), date: d.date, supplier: d.supplier, total: 0, status: d.status })));
    } else {
      let q = supabase.from('dispatches').select('id,note,created_at,status').order('created_at', { ascending: false }).limit(80);
      const { data } = await q;
      setRows((data || []).map((d: any) => ({ id: d.id, document_number: (d.note || '').match(/(\d{6})/)?.[1] || d.id.slice(0, 6), date: (d.created_at || '').slice(0, 10), supplier: '—', total: 0, status: d.status })));
    }
    setSel(null);
  };

  useEffect(() => { search(); /* eslint-disable-next-line */ }, [mode]);

  const titles: Record<DocMode, string> = { vracilo: 'Dokumenti – Prenos blaga', narocilo: 'Dokumenti – Naročila', prevzem: 'Dokumenti – Prevzemi' };

  if (creating) {
    return <DocumentDialog mode={mode} onClose={() => { setCreating(false); search(); }} />;
  }

  return (
    <RetroWindow title={titles[mode]} onClose={onClose} width={560}>
      <div className="mb-2 text-sm font-semibold" style={{ color: '#1a1a1a' }}>Iskanje dokumenta</div>
      <div className="flex items-center gap-2 mb-2 bg-[#bcd0e6] p-2 border" style={{ borderColor: '#7a8a9a' }}>
        <RetroLabel color="#222">{MODE_LABEL[searchMode]}:</RetroLabel>
        <RetroInput
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') search(); }}
          placeholder={searchMode === 'datum' ? 'LLLL-MM-DD' : ''}
          style={{ flex: 1 }}
          autoFocus
        />
        <RetroButton onClick={search}>Išči</RetroButton>
      </div>
      <div className="text-[11px] mb-1" style={{ color: '#1a3a6a' }}>F9 = preklop iskanja (Št. dokumenta ↔ Datum)</div>

      <div className="bg-white border" style={{ borderColor: '#7a8a9a', minHeight: 240, maxHeight: 300, overflow: 'auto' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#e4e8ee] text-left">
              <th className="w-6" />
              <th className="px-2 py-1">Št. dokumenta</th>
              <th className="px-2 py-1">Datum</th>
              <th className="px-2 py-1">Naslov / Dobavitelj</th>
              <th className="px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-gray-400">— ni dokumentov —</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} onClick={() => setSel(i)} className="cursor-pointer"
                  style={{ background: sel === i ? '#1f4a8a' : 'transparent', color: sel === i ? '#fff' : '#111' }}>
                <td className="text-center font-bold" style={{ background: '#e4e8ee', color: '#1a3a6a' }}>{sel === i ? '▶' : ''}</td>
                <td className="px-2 py-1">{r.document_number}</td>
                <td className="px-2 py-1">{r.date}</td>
                <td className="px-2 py-1">{r.supplier}</td>
                <td className="px-2 py-1">
                  <span className="px-2 py-0.5 text-white font-bold"
                        style={{ background: /zapr/i.test(r.status) ? '#1aa040' : '#d83030', borderRadius: 2 }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <RetroButton onClick={() => setCreating(true)}>Ustvari</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default DokumentiListDialog;
