import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RetroWindow, { RetroButton, RetroInput } from "./RetroWindow";

export type DocMode = 'vracilo' | 'narocilo' | 'prevzem';

interface DocRow {
  vrsta: number;
  koda: string;
  naziv: string;
  paket: number;
  kolicina: number;
  cena: number;
  popust: number;
}

interface Loc { id: string; name: string; type: string }

const TITLES: Record<DocMode, string> = {
  vracilo: 'Prenos blaga med oddelki',
  narocilo: 'Naročilo',
  prevzem: 'Prevzem',
};

const DEFAULT_TYPE: Record<DocMode, string> = {
  vracilo: 'VRAČILO',
  narocilo: 'Naročilo',
  prevzem: 'Prevzem',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const todaySL = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const DocumentDialog = ({ mode, onClose, internaKoda = '900001' }: { mode: DocMode; onClose: () => void; internaKoda?: string }) => {
  const [naziv, setNaziv] = useState('');
  const [naslov, setNaslov] = useState('');
  const [stDok, setStDok] = useState(DEFAULT_TYPE[mode]); // free text — letters allowed
  const [datumDok, setDatumDok] = useState(todaySL());
  const [stDokumenta, setStDokumenta] = useState('');
  const [datum] = useState(todaySL());
  const [status, setStatus] = useState<'Odprto' | 'Zaprto'>('Odprto');
  const [locations, setLocations] = useState<Loc[]>([]);
  const [activeTab, setActiveTab] = useState<'Dokument'|'Fakture'|'Prejem'|'Naročilo'|'Opomba'>(mode === 'prevzem' ? 'Prejem' : 'Dokument');

  const [koda, setKoda] = useState('');
  const [kosi, setKosi] = useState('');
  const [rows, setRows] = useState<DocRow[]>([]);
  const [selRow, setSelRow] = useState<number | null>(null);

  const [transporter, setTransporter] = useState(mode === 'prevzem' ? 'Prevoznik' : '');
  const [prevozniPak, setPrevozniPak] = useState(mode === 'prevzem' ? '1' : '');
  const [tezaPaketa, setTezaPaketa] = useState('');
  const [vzrokPrevoza, setVzrokPrevoza] = useState('');
  const [prevoznik2, setPrevoznik2] = useState('');
  const [datumPrevoza, setDatumPrevoza] = useState('');
  const [oblika, setOblika] = useState('');

  // generate seq number once
  useEffect(() => {
    const key = `docseq_${mode}`;
    const n = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
    localStorage.setItem(key, String(n));
    setStDokumenta(String(n).padStart(6, '0'));
  }, [mode]);

  // load locations
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('locations').select('id,name,type').eq('active', true).order('name');
      if (data) setLocations(data as Loc[]);
    })();
  }, []);

  const addRow = async () => {
    if (!koda.trim()) { toast.warning('Vnesite kodo artikla'); return; }
    const q = parseFloat(kosi.replace(',', '.')) || 1;
    const { data: prod } = await supabase
      .from('products')
      .select('ean,sku,name,price,package_qty')
      .or(`ean.eq.${koda.trim()},sku.eq.${koda.trim()}`)
      .maybeSingle();
    const r: DocRow = {
      vrsta: rows.length + 1,
      koda: (prod as any)?.sku || (prod as any)?.ean || koda.trim(),
      naziv: (prod as any)?.name || '—',
      paket: Number((prod as any)?.package_qty || 1),
      kolicina: q,
      cena: Number((prod as any)?.price || 0),
      popust: 0,
    };
    setRows(rs => [...rs, r]);
    setKoda(''); setKosi('');
  };

  const removeRow = () => {
    if (selRow === null) return;
    setRows(rs => rs.filter((_, i) => i !== selRow).map((r, i) => ({ ...r, vrsta: i + 1 })));
    setSelRow(null);
  };

  const total = useMemo(() => rows.reduce((s, r) => s + r.kolicina * r.cena * (1 - r.popust/100), 0), [rows]);

  const save = async () => {
    if (rows.length === 0) { toast.warning('Dokument nima vrstic'); return; }
    const items = rows.map(r => ({
      ean: r.koda, name: r.naziv, qty: r.kolicina, price: r.cena, package_qty: r.paket, discount: r.popust,
    }));
    try {
      if (mode === 'narocilo') {
        await supabase.from('orders').insert({
          supplier: naslov || 'Skladišče',
          date: todayISO(),
          items: items as any,
          from_profile: 'Trgovina',
          to_profile: 'skladisce',
          status: 'Poslano',
          marked_ordered: true,
          note: `Št.dok.: ${stDok} | Št.dokumenta: ${stDokumenta} | Interna: ${internaKoda} | Naziv: ${naziv}`,
        });
        toast.success('Naročilo poslano skladišču');
      } else if (mode === 'prevzem') {
        await supabase.from('prevzemnice').insert({
          document_number: stDokumenta,
          delivery_note_number: stDok,
          delivery_note_date: todayISO(),
          supplier: naslov || 'Skladišče',
          items: items as any,
          total,
          status: 'osnutek',
          notes: `Naziv: ${naziv} | Interna: ${internaKoda}`,
        });
        toast.success('Prevzem ustvarjen');
      } else {
        const fromLoc = locations.find(l => l.name === naslov)?.id || null;
        await supabase.from('dispatches').insert({
          from_location: fromLoc,
          to_location: null,
          items: items as any,
          status: 'pripravljeno',
          note: `Št.dok.: ${stDok} | ${stDokumenta} | ${naziv}`,
        });
        toast.success('Prenos blaga shranjen');
      }
      setStatus('Zaprto');
    } catch (e: any) {
      toast.error('Napaka pri shranjevanju: ' + (e?.message || ''));
    }
  };

  return (
    <RetroWindow title={TITLES[mode]} onClose={onClose} width={840}>
      {/* GLAVA */}
      <fieldset className="border p-3 mb-3" style={{ borderColor: '#7a8a9a' }}>
        <legend className="px-2 text-sm font-semibold" style={{ color: '#1a3a6a' }}>Glava</legend>
        <div className="grid grid-cols-[120px_1fr_100px_1fr_90px] gap-2 items-center">
          <span className="text-sm">Interna koda:</span>
          <RetroInput value={internaKoda} readOnly className="!bg-[#b8d1ec] font-bold" />
          <span className="text-sm text-right">Naziv:</span>
          <RetroInput value={naziv} onChange={e => setNaziv(e.target.value)} />
          <RetroButton onClick={() => setStatus(s => s === 'Odprto' ? 'Zaprto' : 'Odprto')}>Spremeni</RetroButton>

          <span className="text-sm">Št. Dokumenta:</span>
          <RetroInput value={stDokumenta} readOnly className="!bg-[#b8d1ec] font-bold" />
          <span className="text-sm text-right">Naslov:</span>
          <select value={naslov} onChange={e => setNaslov(e.target.value)} className="px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }}>
            <option value="">—</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <RetroButton onClick={() => { setRows([]); setKoda(''); setKosi(''); setNaziv(''); setStatus('Odprto'); }}>Nov</RetroButton>

          <span className="text-sm">Datum:</span>
          <RetroInput value={datum} readOnly className="!bg-[#b8d1ec] font-bold" />
          <span className="text-sm text-right">Status dok.:</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm font-bold text-white" style={{ background: status === 'Odprto' ? '#d83030' : '#1aa040', minWidth: 90, textAlign: 'center', borderRadius: 2 }}>{status}</span>
          </div>
          <span />

          <span />
          <span />
          <span className="text-sm text-right">Št. dok.:</span>
          <RetroInput value={stDok} onChange={e => setStDok(e.target.value)} placeholder="VRAČILO / črke + številke" />
          <span />

          <span />
          <span />
          <span className="text-sm text-right">Datum dok.:</span>
          <RetroInput value={datumDok} onChange={e => setDatumDok(e.target.value)} placeholder="DD/MM/LLLL" />
          <span />
        </div>
      </fieldset>

      {/* PODROBNOSTI */}
      <fieldset className="border p-3 mb-3" style={{ borderColor: '#7a8a9a' }}>
        <legend className="px-2 text-sm font-semibold" style={{ color: '#1a3a6a' }}>Podrobnosti</legend>
        <div className="grid grid-cols-[110px_180px_60px_140px_1fr] gap-2 items-center mb-2">
          <span className="text-sm">Koda artikla:</span>
          <RetroInput value={koda} onChange={e => setKoda(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRow(); }} />
          <span className="text-sm text-right">Kosi:</span>
          <RetroInput value={kosi} onChange={e => setKosi(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addRow(); }} />
          <div className="flex gap-2 justify-end">
            <RetroButton onClick={addRow}>Dodaj</RetroButton>
            <RetroButton onClick={removeRow} disabled={selRow === null}>Briši</RetroButton>
          </div>
        </div>

        <div className="bg-white border overflow-auto" style={{ borderColor: '#7a8a9a', maxHeight: 180 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-[#a8c0d8] text-white">
                <th className="w-6" />
                <th className="px-2 py-1 text-left">Vrsta</th>
                <th className="px-2 py-1 text-left">Koda artikla</th>
                <th className="px-2 py-1 text-left">Naziv</th>
                <th className="px-2 py-1 text-left">Paket</th>
                <th className="px-2 py-1 text-left">Količina</th>
                <th className="px-2 py-1 text-left">Skupna vrednost</th>
                <th className="px-2 py-1 text-left">Popust</th>
                <th className="px-2 py-1 text-left">Cena</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const sel = selRow === i;
                return (
                  <tr
                    key={i}
                    onClick={() => setSelRow(i)}
                    className="cursor-pointer"
                    style={{ background: sel ? '#1f4a8a' : '#fff', color: sel ? '#fff' : '#111' }}
                  >
                    <td className="text-center">{sel ? '▶' : ''}</td>
                    <td className="px-2 py-1">{r.vrsta}</td>
                    <td className="px-2 py-1">{r.koda}</td>
                    <td className="px-2 py-1">{r.naziv}</td>
                    <td className="px-2 py-1">{r.paket}</td>
                    <td className="px-2 py-1">{r.kolicina.toFixed(2)}</td>
                    <td className="px-2 py-1">{(r.kolicina * r.cena * (1 - r.popust/100)).toFixed(2)}</td>
                    <td className="px-2 py-1">{r.popust}</td>
                    <td className="px-2 py-1">{r.cena.toFixed(2)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center py-4 text-gray-500">Brez vrstic – vnesite kodo artikla in pritisnite Enter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </fieldset>

      {/* TABS */}
      <div className="border" style={{ borderColor: '#7a8a9a' }}>
        <div className="flex bg-[#cfdbe9]">
          {(['Dokument','Fakture','Prejem','Naročilo','Opomba'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-3 py-1 text-sm border-r"
              style={{
                borderColor: '#7a8a9a',
                background: activeTab === t ? '#fff' : 'transparent',
                fontWeight: activeTab === t ? 700 : 400,
              }}
            >{t}</button>
          ))}
        </div>
        <div className="p-3 bg-white">
          {activeTab === 'Opomba' ? (
            <textarea className="w-full h-20 border p-2 text-sm" style={{ borderColor: '#6a7a8a' }} placeholder="Opomba…" />
          ) : (
            <div className="grid grid-cols-[120px_1fr_80px_1fr_80px_1fr] gap-2 items-center">
              <span className="text-sm">Transporter:</span>
              <RetroInput value={transporter} onChange={e => setTransporter(e.target.value)} />
              <span className="text-sm text-right">Prevoznik:</span>
              <RetroInput value={prevoznik2} onChange={e => setPrevoznik2(e.target.value)} />
              <span />
              <span />

              <span className="text-sm">Prevozni pak.:</span>
              <RetroInput value={prevozniPak} onChange={e => setPrevozniPak(e.target.value)} />
              <span className="text-sm text-right">Teža paketa:</span>
              <RetroInput value={tezaPaketa} onChange={e => setTezaPaketa(e.target.value)} />
              <span className="text-sm text-right">Datum prevoza:</span>
              <RetroInput value={datumPrevoza} onChange={e => setDatumPrevoza(e.target.value)} />

              <span className="text-sm">Vzrok prevoza:</span>
              <RetroInput value={vzrokPrevoza} onChange={e => setVzrokPrevoza(e.target.value)} />
              <span className="text-sm text-right">Oblika:</span>
              <RetroInput value={oblika} onChange={e => setOblika(e.target.value)} />
              <span /><span />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="text-sm">Skupna vrednost: <b>{total.toFixed(2)} €</b></div>
        <div className="flex gap-2">
          <RetroButton onClick={save}>Shrani</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
};

export default DocumentDialog;
