import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";

interface Row { sku?: string; ean: string; name: string; price: number; }

const ArtikliDialog = ({ onClose }: { onClose: () => void }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    supabase.from('products').select('sku,ean,name,price').limit(20).then(({ data }) => {
      setRows((data as Row[]) || []);
    });
  }, []);

  return (
    <>
      <RetroWindow title="Artikli" onClose={onClose} width={620}>
        <div className="mb-3"><RetroLabel>Podatki o artiklih:</RetroLabel></div>
        <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
          <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#e4e8ee] text-left">
                <th className="w-8" />
                <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Šifra artikla</th>
                <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Ime artikla</th>
                <th className="px-2 py-1 w-28">Cena</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-2 py-3 text-center text-gray-500">Ni podatkov</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#e0e0e0' }}>
                  <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">{i === 0 ? '▶' : ''}</td>
                  <td className="px-2 py-1">{r.sku || r.ean}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1">{Number(r.price).toFixed(2)} EUR</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 7 - rows.length) }).map((_, i) => (
                <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                  <td className="bg-[#e4e8ee]" /><td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <RetroButton onClick={() => setShowSearch(true)}>Iskanje</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </RetroWindow>

      {showSearch && (
        <IskanjeKarticaDialog
          onClose={() => setShowSearch(false)}
          onSelect={(r) => { setRows([r, ...rows.filter(x => x.ean !== r.ean)]); setShowSearch(false); }}
        />
      )}
    </>
  );
};

export const IskanjeKarticaDialog = ({
  onClose, onSelect,
}: { onClose: () => void; onSelect: (r: Row) => void }) => {
  const [koda, setKoda] = useState('');
  const [naziv, setNaziv] = useState('');
  const [crtna, setCrtna] = useState('');
  const [davcna, setDavcna] = useState('');
  const [kodaInd, setKodaInd] = useState('');
  const [results, setResults] = useState<Row[]>([]);

  const izvedi = async () => {
    let q = supabase.from('products').select('sku,ean,name,price').limit(25);
    if (koda) q = q.ilike('sku', `%${koda}%`);
    if (naziv) q = q.ilike('name', `%${naziv}%`);
    if (crtna) q = q.ilike('ean', `%${crtna}%`);
    const { data } = await q;
    setResults((data as Row[]) || []);
  };

  return (
    <RetroWindow title="Iskanje - kartica artikla" onClose={onClose} width={560} zIndex={60} offsetX={40} offsetY={40}>
      <div className="border bg-[#cfdbe9] p-3 mb-3" style={{ borderColor: '#7a8a9a' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: '#1a3a6a' }}>Opcije iskanja</div>
        <div className="grid grid-cols-[110px_1fr_110px_1fr_70px] gap-2 items-center">
          <RetroLabel color="#222">Koda artikla:</RetroLabel>
          <RetroInput value={koda} onChange={e => setKoda(e.target.value)} />
          <RetroLabel color="#222">Dok. davčna št.:</RetroLabel>
          <RetroInput value={davcna} onChange={e => setDavcna(e.target.value)} />
          <RetroButton onClick={izvedi} className="row-span-3 h-full" >izvedi</RetroButton>

          <RetroLabel color="#222">Naziv artikla:</RetroLabel>
          <RetroInput value={naziv} onChange={e => setNaziv(e.target.value)} />
          <RetroLabel color="#222">Koda art. IND:</RetroLabel>
          <RetroInput value={kodaInd} onChange={e => setKodaInd(e.target.value)} />

          <RetroLabel color="#222">Črtna koda:</RetroLabel>
          <RetroInput value={crtna} onChange={e => setCrtna(e.target.value)} />
          <span /><span />
        </div>
      </div>
      <div className="text-xs font-semibold mb-1" style={{ color: '#1a3a6a' }}>Rezultat iskanja:</div>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
        <table className="w-full text-sm">
          <tbody>
            {results.length === 0 && (
              <tr><td className="w-8 bg-[#e4e8ee] text-center text-[#1a3a6a]">▶</td><td className="px-2 py-1 text-gray-400">— pritisnite izvedi —</td></tr>
            )}
            {results.map((r, i) => (
              <tr key={i} className="border-t cursor-pointer hover:bg-blue-50" style={{ borderColor: '#e0e0e0' }} onClick={() => onSelect(r)}>
                <td className="w-8 bg-[#e4e8ee] text-center text-[#1a3a6a]">▶</td>
                <td className="px-2 py-1">{r.name}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - results.length) }).map((_, i) => (
              <tr key={`e-${i}`} className="border-t h-6" style={{ borderColor: '#e0e0e0' }}>
                <td className="bg-[#e4e8ee]" /><td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <RetroButton onClick={() => results[0] && onSelect(results[0])}>Potrdi</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default ArtikliDialog;
