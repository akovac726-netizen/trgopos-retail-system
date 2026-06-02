import { useState, useRef, useEffect } from "react";
import OtvoritevDialog from "./retro/OtvoritevDialog";
import ArtikliDialog from "./retro/ArtikliDialog";
import FinancnaPorocilaDialog from "./retro/FinancnaPorocilaDialog";
import NalepkeDialog from "./retro/NalepkeDialog";

interface ShopHomePageProps {
  onNavigate: (tab: string) => void;
  onOpenBackend: () => void;
  onLogout: () => void;
  userLabel: string;
}

type Variant = 'default' | 'green' | 'red' | 'cyan' | 'yellow' | 'blue' | 'pink' | 'disabled';
interface Btn {
  label: string;
  tab?: string;
  action?: () => void;
  variant?: Variant;
  col: number; // 1-4
  row: number; // 1-9
  rowSpan?: number;
}

const ShopHomePage = ({ onNavigate, onOpenBackend, onLogout, userLabel }: ShopHomePageProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'otvoritev' | 'artikli' | 'financna' | 'nalepke'>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const variantStyle = (v?: Variant): React.CSSProperties => {
    switch (v) {
      case 'green':
        return { background: 'linear-gradient(180deg,#b8e0b0 0%,#8fc77f 100%)', color: '#0a5c1a', border: '1px solid #5a9050' };
      case 'red':
        return { background: 'linear-gradient(180deg,#f5c8a8 0%,#e9a878 100%)', color: '#b30000', border: '1px solid #a06040' };
      case 'pink':
        return { background: 'linear-gradient(180deg,#f0d0d0 0%,#e0b8b8 100%)', color: '#222', border: '1px solid #b08080' };
      case 'cyan':
        return { background: 'linear-gradient(180deg,#4cb4c0 0%,#3a98a4 100%)', color: '#fff', border: '1px solid #2a7a86' };
      case 'yellow':
        return { background: '#fff200', color: '#b30000', border: '1px solid #c0b800', fontWeight: 700 };
      case 'blue':
        return { background: 'linear-gradient(180deg,#4a7fb8 0%,#365e94 100%)', color: '#fff', border: '1px solid #2a4870' };
      case 'disabled':
        return { background: 'linear-gradient(180deg,#dcdcdc 0%,#c0c0c0 100%)', color: '#888', border: '1px solid #a0a0a0', cursor: 'not-allowed' };
      default:
        return { background: 'linear-gradient(180deg,#e8e8e8 0%,#c8c8c8 100%)', color: '#1a1a1a', border: '1px solid #8a8a8a' };
    }
  };

  const handleClick = (b: Btn) => {
    if (b.variant === 'disabled') return;
    if (b.action) b.action();
    else if (b.tab) onNavigate(b.tab);
  };

  // Top menu structure — matching slide labels exactly
  const topMenus: Record<string, { label: string; action: () => void }[]> = {
    Datoteke: [
      { label: 'Odpri dokument', action: () => onNavigate('dokumenti') },
      { label: 'Shrani', action: () => {} },
      { label: 'Izhod', action: onLogout },
    ],
    Trgovina: [
      { label: 'Otvoritev', action: () => onNavigate('poslovanje') },
      { label: 'Zapiranje', action: () => onNavigate('zakljucevanje') },
      { label: 'Artikli', action: () => onNavigate('artikli') },
      { label: 'Inventura', action: () => onNavigate('inventura') },
    ],
    'Tiskanje SLO': [
      { label: 'Cenovke / Nalepke', action: () => onNavigate('nalepke') },
      { label: 'Finančno poročilo', action: () => onNavigate('financna') },
      { label: 'Dnevni promet', action: () => onNavigate('financna') },
    ],
    Orodja: [
      { label: 'TrgoBackEnd', action: onOpenBackend },
      { label: 'Prenos blaga', action: () => onNavigate('dokumenti') },
      { label: 'Planogramma', action: () => alert('Planogramma — modul v pripravi') },
    ],
    Urniki: [
      { label: 'Urniki zaposlenih', action: () => onNavigate('urnik') },
      { label: 'Naročila', action: () => onNavigate('narocila') },
    ],
    'Izdaje dopustov': [
      { label: 'Pregled dopustov', action: onOpenBackend },
      { label: 'Nov zahtevek', action: onOpenBackend },
    ],
    'Tiskanje HR': [
      { label: 'Kadrovski izpiski', action: onOpenBackend },
      { label: 'Plačilne liste', action: onOpenBackend },
    ],
  };

  const buttons: Btn[] = [
    // Column 1
    { label: '„DEDICATA A TE"', action: onOpenBackend, variant: 'pink', col: 1, row: 1 },
    { label: 'Urniki', tab: 'urnik', col: 1, row: 4 },
    { label: 'Kliknite-izbiraj naroč.', tab: 'narocila', col: 1, row: 7 },
    { label: 'Reclami qualita', action: () => alert('Reklamacije / kvaliteta'), col: 1, row: 8 },
    // Column 2
    { label: 'Otvoritev', tab: 'poslovanje', variant: 'green', col: 2, row: 1 },
    { label: 'Zapiranje', tab: 'zakljucevanje', variant: 'red', col: 2, row: 2 },
    { label: 'Dokumenti', tab: 'dokumenti', col: 2, row: 3 },
    { label: 'Naročila', tab: 'narocila', col: 2, row: 4 },
    { label: 'Kavcije', variant: 'disabled', col: 2, row: 5 },
    { label: 'Prodaja Gift\nCard', tab: 'bonikartice', col: 2, row: 6 },
    { label: 'Sef', action: () => alert('Sef — dostop omejen na 00087'), variant: 'disabled', col: 2, row: 7 },
    { label: 'F. Izberi Popust', variant: 'disabled', col: 2, row: 8 },
    { label: 'Neprodano vodič za naročilo', tab: 'narocila', variant: 'cyan', col: 2, row: 9 },
    // Column 3
    { label: 'Finančno\nporočilo', tab: 'financna', col: 3, row: 1 },
    { label: 'Ponudbe - Akcije', tab: 'akcije_top', col: 3, row: 2 },
    { label: 'Fakture', tab: 'racuni', col: 3, row: 3 },
    { label: 'Prevzemi', tab: 'dokumenti', col: 3, row: 4 },
    { label: 'Prejem blag.\ndirek. dob.', tab: 'dokumenti', col: 3, row: 5 },
    { label: 'Prodaja\ntelefonskih vred.', variant: 'disabled', col: 3, row: 6 },
    { label: 'NEW !!\nPlanogramma', action: () => alert('Planogramma — modul v pripravi'), variant: 'yellow', col: 3, row: 7 },
    { label: 'K. Izberi Popust', variant: 'disabled', col: 3, row: 8 },
    // Column 4
    { label: 'Inventura', tab: 'inventura', col: 4, row: 1 },
    { label: 'Artikli', tab: 'artikli', col: 4, row: 2 },
    { label: 'Nalepke', tab: 'nalepke', col: 4, row: 3 },
    { label: 'Prenos blaga\nmed oddelki', tab: 'dokumenti', col: 4, row: 4 },
    { label: 'Izhod\n↵', action: onLogout, variant: 'blue', col: 4, row: 7, rowSpan: 2 },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden select-none" style={{ fontFamily: '"Tw Cen MT","Century Gothic",system-ui,sans-serif' }}>
      {/* Window title bar */}
      <div className="h-6 flex items-center justify-end px-2 text-white text-xs" style={{ background: 'linear-gradient(180deg,#2b3a55 0%,#1a2540 100%)' }}>
        <span className="px-2 cursor-default">_</span>
        <span className="px-2 cursor-default">▢</span>
        <button onClick={onLogout} className="px-2 hover:bg-red-600">X</button>
      </div>

      {/* Menu bar */}
      <div ref={menuRef} className="h-7 flex items-center text-sm" style={{ background: 'linear-gradient(180deg,#9098a8 0%,#7a8294 100%)', color: '#e8e8e8' }}>
        {Object.keys(topMenus).map(m => (
          <div key={m} className="relative h-full">
            <button
              onClick={() => setOpenMenu(openMenu === m ? null : m)}
              onMouseEnter={() => openMenu && setOpenMenu(m)}
              className={`px-3 h-full hover:bg-white/20 ${openMenu === m ? 'bg-white/25 text-white' : ''}`}
            >
              {m}
            </button>
            {openMenu === m && (
              <div className="absolute top-full left-0 bg-white text-gray-900 border border-gray-500 shadow-xl min-w-[200px] z-50">
                {topMenus[m].map((it, i) => (
                  <button
                    key={i}
                    onClick={() => { it.action(); setOpenMenu(null); }}
                    className="block w-full text-left px-4 py-1.5 text-sm hover:bg-blue-600 hover:text-white"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-6" style={{ background: '#c8d4e6' }}>
        <div
          className="grid w-full max-w-[900px] h-full max-h-[640px]"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(9, minmax(0, 1fr))',
            columnGap: '14px',
            rowGap: '8px',
          }}
        >
          {buttons.map((b, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(b)}
              disabled={b.variant === 'disabled'}
              style={{
                ...variantStyle(b.variant),
                gridColumn: b.col,
                gridRow: b.rowSpan ? `${b.row} / span ${b.rowSpan}` : b.row,
                whiteSpace: 'pre-line',
                fontSize: '13px',
                borderRadius: '3px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 1px rgba(0,0,0,0.15)',
              }}
              className="px-2 py-1 font-medium leading-tight transition-all hover:brightness-105 active:brightness-95"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="h-6 flex items-center text-xs text-white" style={{ background: 'linear-gradient(180deg,#7a8294 0%,#5a6274 100%)' }}>
        <div className="px-3 h-full flex items-center border-r border-black/20" style={{ background: '#a05858' }}>
          {userLabel.startsWith('Uporabnik:') ? userLabel : `Uporabnik: ${userLabel}`}
        </div>
        <div className="px-3 h-full flex items-center border-r border-black/20" style={{ background: '#5a8a9a' }}>
          Negoizo: 900001
        </div>
        <div className="px-3 h-full flex items-center flex-1">Funkcije:</div>
      </div>
    </div>
  );
};

export default ShopHomePage;
