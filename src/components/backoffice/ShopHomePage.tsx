import { useState, useRef, useEffect } from "react";

interface ShopHomePageProps {
  onNavigate: (tab: string) => void;
  onOpenBackend: () => void;
  onLogout: () => void;
  userLabel: string;
}

interface MenuButton {
  label: string;
  tab?: string;
  action?: () => void;
  variant?: 'default' | 'green' | 'red' | 'cyan' | 'yellow' | 'blue' | 'disabled';
  className?: string;
}

const ShopHomePage = ({ onNavigate, onOpenBackend, onLogout, userLabel }: ShopHomePageProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const variantClass = (v?: MenuButton['variant']) => {
    switch (v) {
      case 'green': return 'bg-gradient-to-b from-green-200 to-green-300 text-green-900 border-green-500 hover:brightness-95';
      case 'red': return 'bg-gradient-to-b from-orange-200 to-orange-300 text-red-700 border-orange-400 hover:brightness-95';
      case 'cyan': return 'bg-cyan-500 text-white border-cyan-700 hover:bg-cyan-600';
      case 'yellow': return 'bg-yellow-300 text-black border-yellow-500 hover:bg-yellow-400 font-bold';
      case 'blue': return 'bg-blue-500 text-white border-blue-700 hover:bg-blue-600';
      case 'disabled': return 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed';
      default: return 'bg-gradient-to-b from-gray-200 to-gray-300 text-gray-900 border-gray-400 hover:brightness-95';
    }
  };

  const handleClick = (btn: MenuButton) => {
    if (btn.variant === 'disabled') return;
    if (btn.action) btn.action();
    else if (btn.tab) onNavigate(btn.tab);
  };

  // Top menu structure
  const topMenus: Record<string, { label: string; action: () => void }[]> = {
    Datoteka: [
      { label: 'Nov dokument', action: () => onNavigate('dokumenti') },
      { label: 'Odpri', action: () => onNavigate('dokumenti') },
      { label: 'Shrani', action: () => {} },
      { label: 'Izhod', action: onLogout },
    ],
    Pogled: [
      { label: 'Poslovanje', action: () => onNavigate('poslovanje') },
      { label: 'Artikli', action: () => onNavigate('artikli') },
      { label: 'Inventura', action: () => onNavigate('inventura') },
      { label: 'Naročila', action: () => onNavigate('narocila') },
    ],
    Operacije: [
      { label: 'Otvoritev blagajne', action: () => onNavigate('poslovanje') },
      { label: 'Zaključevanje', action: () => onNavigate('zakljucevanje') },
      { label: 'Prevzemi', action: () => onNavigate('dokumenti') },
      { label: 'Prenos blaga', action: () => onNavigate('dokumenti') },
    ],
    Poročila: [
      { label: 'Finančna poročila', action: () => onNavigate('financna') },
      { label: 'Promet po blagajnah', action: () => onNavigate('financna') },
      { label: 'Inventurno poročilo', action: () => onNavigate('inventura') },
    ],
    Nastavitve: [
      { label: 'Trgovina', action: () => onNavigate('partnerji') },
      { label: 'Tiskalnik / Cenovke', action: () => onNavigate('nalepke') },
      { label: 'Uporabnik', action: onOpenBackend },
    ],
    Pomoč: [
      { label: 'O programu', action: () => alert('TrgoPOS BackOffice — StandBuy s. p. © 2026') },
      { label: 'Navodila', action: () => window.open('https://standbuy.si', '_blank') },
    ],
  };

  // Grid layout matching Diapozitiv 2
  const grid: (MenuButton | null)[][] = [
    // Row 1
    [
      { label: 'TrgoBackEnd', action: onOpenBackend, className: 'bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-500' },
      { label: 'Otvoritev', tab: 'poslovanje', variant: 'green' },
      { label: 'Finančno\nporočilo', tab: 'financna' },
      { label: 'Inventura', tab: 'inventura' },
    ],
    // Row 2
    [
      null,
      { label: 'Zapiranje', tab: 'zakljucevanje', variant: 'red' },
      { label: 'Ponudbe - Akcije', tab: 'akcije_top' },
      { label: 'Artikli', tab: 'artikli' },
    ],
    // Row 3
    [
      null,
      { label: 'Dokumenti', tab: 'dokumenti' },
      { label: 'Fakture', tab: 'racuni' },
      { label: 'Nalepke', tab: 'nalepke' },
    ],
    // Row 4
    [
      { label: 'Urniki', tab: 'urnik' },
      { label: 'Naročila', tab: 'narocila' },
      { label: 'Prevzemi', tab: 'dokumenti' },
      { label: 'Prenos blaga\nmed oddelki', tab: 'dokumenti' },
    ],
    // Row 5
    [
      null,
      { label: 'Kavcije', variant: 'disabled' },
      { label: 'Prejem blag.\ndirek. dob.', tab: 'dokumenti' },
      null,
    ],
    // Row 6
    [
      null,
      { label: 'Prodaja Gift\nCard', tab: 'bonikartice' },
      { label: 'Prodaja\ntelefonskih vred.', variant: 'disabled' },
      null,
    ],
    // Row 7
    [
      { label: 'Klikni-izbiraj naroč.', tab: 'narocila' },
      { label: 'Sef', action: () => alert('Sef - dostop omejen na PODPORO STANDBUY (00087)') },
      { label: 'NEW !!\nPlanogramma', action: () => alert('Planogramma — modul v pripravi'), variant: 'yellow' },
      { label: 'Izhod', action: onLogout, variant: 'blue', className: 'row-span-2 h-full' },
    ],
    // Row 8
    [
      { label: 'Reclami qualita', action: () => alert('Reklamacije / kvaliteta — odprite Dokumenti → Reklamacije') },
      { label: 'F. Izberi Popust', variant: 'disabled' },
      { label: 'K. Izberi Popust', variant: 'disabled' },
      null,
    ],
    // Row 9 (bottom band)
    [
      null,
      { label: 'Neprodano vodič za naročilo', tab: 'narocila', variant: 'cyan', className: 'col-span-2' },
      null,
      null,
    ],
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-backoffice">
      {/* Top menu bar */}
      <div ref={menuRef} className="bg-slate-800 text-white flex items-center px-2 h-7 text-sm select-none">
        <div className="flex">
          {Object.keys(topMenus).map(menu => (
            <div key={menu} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
                onMouseEnter={() => openMenu && setOpenMenu(menu)}
                className={`px-3 h-7 hover:bg-slate-700 ${openMenu === menu ? 'bg-slate-700' : ''}`}
              >
                {menu}
              </button>
              {openMenu === menu && (
                <div className="absolute top-full left-0 bg-white text-gray-900 border border-gray-400 shadow-xl min-w-[200px] z-50">
                  {topMenus[menu].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { item.action(); setOpenMenu(null); }}
                      className="block w-full text-left px-4 py-1.5 text-sm hover:bg-blue-500 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-300 px-3">{userLabel}</div>
        <div className="flex gap-1">
          <button className="w-7 h-7 hover:bg-slate-700 text-xs">_</button>
          <button className="w-7 h-7 hover:bg-slate-700 text-xs">▢</button>
          <button onClick={onLogout} className="w-7 h-7 hover:bg-red-600 text-xs">×</button>
        </div>
      </div>

      {/* Main grid area */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 overflow-hidden">
        <div className="grid grid-cols-4 gap-x-3 gap-y-2 max-w-5xl w-full">
          {grid.flatMap((row, rowIdx) =>
            row.map((btn, colIdx) => {
              if (!btn) return <div key={`${rowIdx}-${colIdx}`} />;
              const isMulti = btn.label.includes('\n');
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => handleClick(btn)}
                  disabled={btn.variant === 'disabled'}
                  className={`min-h-[60px] px-2 py-2 text-sm font-medium border-2 rounded shadow-sm transition-all ${variantClass(btn.variant)} ${btn.className || ''}`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {btn.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom logo */}
      <div className="absolute bottom-2 right-3 text-xs text-gray-400">
        <span className="font-black text-base">
          <span className="text-teal-500">Stand</span>
          <span className="text-teal-600">Buy</span>
          <span className="text-orange-400 ml-0.5">★</span>
        </span>
      </div>
    </div>
  );
};

export default ShopHomePage;
