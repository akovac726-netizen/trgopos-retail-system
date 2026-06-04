import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput } from "./RetroWindow";
import jsPDF from "jspdf";

export interface ArticleRow {
  sku?: string;
  ean: string;
  name: string;
  price?: number;
  old_price?: number | null;
  description?: string | null;
  country?: string | null;
  size_info?: string | null;
  image_url?: string | null;
  stock?: number | null;
  vat_rate?: number | null;
}

interface Props {
  article: ArticleRow;
  onClose: () => void;
}

type ViewMode = 'ean' | 'sku' | 'ind' | 'zaloga';

const KarticaArtiklaDialog = ({ article, onClose }: Props) => {
  const [view, setView] = useState<ViewMode>('ean');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [trgStock, setTrgStock] = useState<number | null>(null);
  const [sklStock, setSklStock] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Find product id by EAN
      const { data: prod } = await supabase.from('products').select('id').eq('ean', article.ean).maybeSingle();
      if (!prod) return;
      const { data: stocks } = await supabase
        .from('location_stock')
        .select('stock, location_id, locations:locations!inner(type)')
        .eq('product_id', (prod as any).id);
      if (cancelled || !stocks) return;
      let trg = 0, skl = 0;
      (stocks as any[]).forEach(r => {
        const t = r.locations?.type;
        if (t === 'pe') trg += Number(r.stock || 0);
        else if (t === 'gl_skl' || t === 'skladisce') skl += Number(r.stock || 0);
      });
      setTrgStock(trg);
      setSklStock(skl);
    })();
    return () => { cancelled = true; };
  }, [article.ean]);


  const izvoziPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Kartica artikla: ${article.name}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`EAN: ${article.ean}`, 14, 28);
    doc.text(`Šifra: ${article.sku || '-'}`, 14, 35);
    doc.text(`Cena: ${article.price?.toFixed(2) ?? '-'} EUR`, 14, 42);
    doc.text(`Zaloga: ${article.stock ?? 0}`, 14, 49);
    doc.text(`DDV: ${article.vat_rate ?? 22}%`, 14, 56);
    if (from || to) doc.text(`Obdobje: ${from || '...'} - ${to || '...'}`, 14, 63);
    doc.save(`kartica-${article.sku || article.ean}.pdf`);
  };

  return (
    <RetroWindow title="Kartica Artiklov" onClose={onClose} width={520} zIndex={70} offsetX={-30} offsetY={-30}>
      <div className="flex gap-3">
        {/* Slika */}
        <div className="w-[130px] h-[130px] bg-white border flex items-center justify-center text-center text-sm font-semibold text-[#444] flex-shrink-0" style={{ borderColor: '#7a8a9a' }}>
          {article.image_url ? <img src={article.image_url} alt={article.name} className="max-w-full max-h-full" /> : <>SLIKA<br />ARTIKLA</>}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <RetroInput value={article.name} readOnly className="w-full" />
          <div className="text-sm font-semibold" style={{ color: '#1a3a6a' }}>Promet po datumu:</div>
          <div className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-2 py-1 text-sm bg-white border w-full min-w-0" style={{ borderColor: '#6a7a8a', boxSizing: 'border-box' }} />
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-2 py-1 text-sm bg-white border w-full min-w-0" style={{ borderColor: '#6a7a8a', boxSizing: 'border-box' }} />
            </div>
            <RetroButton onClick={izvoziPdf} className="!px-2 leading-tight text-xs">Izvozi<br/>PDF</RetroButton>
          </div>
          <div>
            <button className="px-3 py-0.5 text-xs border" style={{ background: 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)', borderColor: '#7a7a7a' }}>Opombe</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <TabBtn active={view === 'ean'} onClick={() => setView('ean')}>EAN artikla</TabBtn>
        <TabBtn active={view === 'sku'} onClick={() => setView('sku')}>Šifra artikla</TabBtn>
        <TabBtn active={view === 'ind'} onClick={() => setView('ind')} disabled>Koda art. IND:</TabBtn>
        <TabBtn active={view === 'zaloga'} onClick={() => setView('zaloga')}>Zaloga</TabBtn>
      </div>

      <div className="mt-2 bg-[#dcdcdc] border min-h-[140px] max-h-[200px] overflow-auto" style={{ borderColor: '#7a8a9a' }}>
        {view === 'zaloga' ? (
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Zaloga Trgovina:', trgStock != null ? String(trgStock) : '...'],
                ['Zaloga Skladišče:', sklStock != null ? String(sklStock) : '...'],
                ['Skupna zaloga:', String((trgStock ?? 0) + (sklStock ?? 0))],
                ['Nabavljena kol.:', '-'],
                ['Prodana kol.:', '-'],
                ['DDV:', `${article.vat_rate ?? 22}%`],
                ['Prodajna cena:', article.price != null ? `${article.price.toFixed(2)} €` : '-'],
              ].map(([k, v]) => (
                <tr key={k} className="border-b" style={{ borderColor: '#bfbfbf' }}>
                  <td className="px-2 py-1 bg-[#e4e8ee] font-semibold w-[55%]" style={{ color: '#222' }}>{k}</td>
                  <td className="px-2 py-1 bg-white">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-white">
                <td className="w-8 text-center bg-[#e4e8ee] text-[#1a3a6a]">▶</td>
                <td className="px-2 py-1 w-[180px] border-r" style={{ borderColor: '#c8c8c8' }}>
                  {view === 'ean' ? article.ean : view === 'sku' ? (article.sku || '—') : '—'}
                </td>
                <td className="px-2 py-1">{article.name}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <RetroButton onClick={izvoziPdf}>Izvozi</RetroButton>
        <RetroButton onClick={onClose}>Potrdi</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

const TabBtn = ({ children, active, onClick, disabled }: { children: React.ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-2 py-1 text-sm border w-full"
    style={{
      background: active ? 'linear-gradient(180deg,#b8b8b8 0%,#909090 100%)' : 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)',
      borderColor: '#7a7a7a',
      color: disabled ? '#888' : '#111',
      borderRadius: 2,
      boxShadow: active ? 'inset 0 1px 2px rgba(0,0,0,0.3)' : 'inset 0 1px 0 rgba(255,255,255,0.6)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

export default KarticaArtiklaDialog;
