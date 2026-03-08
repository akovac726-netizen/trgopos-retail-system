import { Settings, LogOut, Info } from "lucide-react";
import { Cashier } from "@/types/pos";

export type POSTab = 'blagajna' | 'racuni' | 'zakljucek';

interface POSHeaderProps {
  cashier: Cashier | null;
  activeTab: POSTab;
  onTabChange: (tab: POSTab) => void;
  onLogout: () => void;
  onInfo: () => void;
  onSettings: () => void;
}

const POSHeader = ({ cashier, activeTab, onTabChange, onLogout, onInfo, onSettings }: POSHeaderProps) => {
  const tabs: { id: POSTab; label: string }[] = [
    { id: 'blagajna', label: 'Blagajna' },
    { id: 'racuni', label: 'Računi' },
    { id: 'zakljucek', label: 'Zaključek' },
  ];

  return (
    <header className="px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #5bb8e8, #3a9fd8)' }}>
      <div className="bg-white/90 rounded px-3 py-1.5 text-sm font-medium text-gray-800">
        Blagajna. št.: <strong>1</strong>, Blagajnik: <strong>{cashier?.name || 'ime in priimek'}</strong>
      </div>

      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`px-5 py-1.5 rounded text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white shadow-md'
                : 'bg-sky-200/60 text-sky-800 hover:bg-sky-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onInfo} className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors border border-gray-400" title="Informacije">
          <Info className="w-5 h-5 text-gray-700" />
        </button>
        <button onClick={onSettings} className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors border border-gray-400" title="Nastavitve">
          <Settings className="w-5 h-5 text-gray-700" />
        </button>
        <button onClick={onLogout} className="w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors border border-gray-400" title="Odjava">
          <LogOut className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </header>
  );
};

export default POSHeader;
