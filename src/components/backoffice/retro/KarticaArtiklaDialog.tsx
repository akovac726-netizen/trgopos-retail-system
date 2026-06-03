import { useState } from "react";
import RetroWindow, { RetroButton, RetroInput } from "./RetroWindow";

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
}

interface Props {
  article: ArticleRow;
  onClose: () => void;
}

type ViewMode = 'ean' | 'sku' | 'ind';

const KarticaArtiklaDialog = ({ article, onClose }: Props) => {
  const [view, setView] = useState<ViewMode>('ean');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const exportCsv = () => {
    const csv = `Naziv;EAN;Šifra;Cena\n"${article.name}";${article.ean};${article.sku || ''};${article.price ?? ''}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${article.sku || article.ean}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RetroWindow title="Kartica Artiklov" onClose={onClose} width={520} zIndex={70} offsetX={-30} offsetY={-30}>
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-[130px] h-[130px] bg-white border flex items-center justify-center text-center text-sm font-semibold text-[#444]" style={{ borderColor: '#7a8a9a' }}>
          {article.image_url ? <img src={article.image_url} alt={article.name} className="max-w-full max-h-full" /> : <>SLIKA<br />ARTIKLA</>}
        </div>
        <div className="flex-1 space-y-2">
          <RetroInput value={article.name} readOnly />
          <div className="text-sm font-semibold" style={{ color: '#1a3a6a' }}>Promet po datumu:</div>
          <div className="flex gap-2">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="flex-1 px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="flex-1 px-2 py-1 text-sm bg-white border" style={{ borderColor: '#6a7a8a' }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <TabBtn active={view === 'ean'} onClick={() => setView('ean')}>EAN artikla</TabBtn>
        <TabBtn active={view === 'sku'} onClick={() => setView('sku')}>Šifra artikla</TabBtn>
        <TabBtn active={view === 'ind'} onClick={() => setView('ind')} disabled>Koda art. IND:</TabBtn>
      </div>

      <div className="mt-2 bg-[#dcdcdc] border min-h-[120px]" style={{ borderColor: '#7a8a9a' }}>
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
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <RetroButton onClick={exportCsv}>Izvozi</RetroButton>
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
    className="px-3 py-1 text-sm border"
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
