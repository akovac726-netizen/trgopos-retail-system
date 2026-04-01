import { Key, Search, Menu } from "lucide-react";
import { Cashier } from "@/types/pos";

export type POSTab = 'blagajna' | 'racuni' | 'zakljucek';

interface POSHeaderProps {
  cashier: Cashier | null;
  activeTab: POSTab;
  registerId: number;
  onTabChange: (tab: POSTab) => void;
  onLogout: () => void;
  onInfo: () => void;
  onSettings: () => void;
  onProductSearch?: () => void;
  isSelfCheckout?: boolean;
  selfCheckoutLabel?: string;
}

const POSHeader = ({ cashier, activeTab, registerId, onTabChange, onLogout, onInfo, onSettings, onProductSearch, isSelfCheckout, selfCheckoutLabel }: POSHeaderProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('sl-SI');
  const timeStr = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="flex items-center justify-between px-0 py-0" style={{ background: 'linear-gradient(180deg, #87ceeb, #5bb8e8)' }}>
      {/* Left: action buttons */}
      <div className="flex items-center">
        <button onClick={onLogout} className="flex flex-col items-center justify-center px-4 py-2 border-r border-sky-400/50 hover:bg-sky-400/30 transition-colors">
          <Key className="w-6 h-6 text-gray-800" />
          <span className="text-xs font-medium text-gray-800">Abmelden</span>
        </button>
        <button onClick={onProductSearch || onInfo} className="flex flex-col items-center justify-center px-4 py-2 border-r border-sky-400/50 hover:bg-sky-400/30 transition-colors">
          <Search className="w-6 h-6 text-gray-800" />
          <span className="text-xs font-medium text-gray-800">Artikelsuche</span>
        </button>
        <button onClick={() => onTabChange(activeTab === 'zakljucek' ? 'blagajna' : 'zakljucek')} className="flex flex-col items-center justify-center px-4 py-2 border-r border-sky-400/50 hover:bg-sky-400/30 transition-colors">
          <Menu className="w-6 h-6 text-gray-800" />
          <span className="text-xs font-medium text-gray-800">Gl. meni</span>
        </button>
      </div>

      {/* Center: StandBuy logo */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-2xl font-black tracking-wide">
          <span className="text-sky-700">Stand</span><span className="text-sky-800">Buy</span>
          <span className="text-orange-500 text-xl ml-0.5">★</span>
        </h1>
      </div>

      {/* Right: date/time, register, cashier info */}
      <div className="text-right pr-3 py-1 text-xs text-gray-800 font-medium leading-tight">
        <div>({dateStr} {timeStr})</div>
        <div>Blagajna: <strong>{isSelfCheckout ? (selfCheckoutLabel || 'A1') : registerId}</strong></div>
        <div>Blagajnik: <strong>{cashier?.name || ''}</strong></div>
      </div>
    </header>
  );
};

export default POSHeader;
