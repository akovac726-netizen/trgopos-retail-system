import { Settings, LogOut } from "lucide-react";
import { Cashier } from "@/types/pos";

export type POSTab = 'blagajna' | 'racuni' | 'zakljucek';

interface POSHeaderProps {
  cashier: Cashier | null;
  activeTab: POSTab;
  onTabChange: (tab: POSTab) => void;
  onLogout: () => void;
}

const POSHeader = ({ cashier, activeTab, onTabChange, onLogout }: POSHeaderProps) => {
  const tabs: { id: POSTab; label: string }[] = [
    { id: 'blagajna', label: 'Blagajna' },
    { id: 'racuni', label: 'Računi' },
    { id: 'zakljucek', label: 'Zaključek' },
  ];

  return (
    <header className="px-4 py-2 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, #5bb8e8, #3a9fd8)' }}>
      {/* Left - Cashier info */}
      <div className="bg-white/90 rounded px-3 py-1.5 text-sm font-medium text-gray-800 min-w-[280px]">
        Blagajna. št.: <strong>1</strong>, Blagajnik: <strong>{cashier?.name || 'ime in priimek'}</strong>
      </div>

      {/* Center - Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white shadow-md'
                : 'bg-sky-200/60 text-sky-800 hover:bg-sky-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 bg-white/30 hover:bg-white/50 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-white" />
        </button>
        <button onClick={onLogout} className="p-2 bg-white/30 hover:bg-white/50 rounded-lg transition-colors" title="Odjava">
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
};

export default POSHeader;
