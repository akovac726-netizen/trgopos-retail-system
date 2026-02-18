import { 
  Percent, 
  XCircle, 
  RotateCcw, 
  Tag,
  DoorOpen,
  Lock,
  Search,
  Hash,
  Receipt
} from "lucide-react";

interface ActionButtonsProps {
  onDiscount: () => void;
  onReturn: () => void;
  onPriceCheck: () => void;
  onReceipts: () => void;
  onOpenDrawer: () => void;
  onProductSearch: () => void;
  onQuantity: () => void;
  onStorno: () => void;
  hasItems: boolean;
  hasSelectedItem: boolean;
  isAdmin: boolean;
}

const ActionButtons = ({
  onDiscount,
  onReturn,
  onPriceCheck,
  onReceipts,
  onOpenDrawer,
  onProductSearch,
  onQuantity,
  onStorno,
  hasItems,
  hasSelectedItem,
  isAdmin
}: ActionButtonsProps) => {
  const actionButtons = [
    { label: "Iskanje", icon: Search, onClick: onProductSearch, className: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-600" },
    { label: "Količina", icon: Hash, onClick: onQuantity, disabled: !hasSelectedItem, className: "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600" },
    { label: "Popust", icon: Percent, onClick: onDiscount, disabled: !hasItems, className: "bg-violet-500/20 hover:bg-violet-500/30 text-violet-600" },
    { label: "Storno art.", icon: XCircle, onClick: onStorno, disabled: !hasSelectedItem, className: "bg-red-500/20 hover:bg-red-500/30 text-red-600" },
    { label: "Vračilo", icon: RotateCcw, onClick: onReturn, className: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-600" },
    { label: "Preveri ceno", icon: Tag, onClick: onPriceCheck, className: "bg-teal-500/20 hover:bg-teal-500/30 text-teal-600" },
    { label: "Računi", icon: Receipt, onClick: onReceipts, className: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actionButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={`h-14 flex flex-col items-center justify-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btn.className}`}
        >
          <btn.icon className="w-5 h-5" />
          <span className="text-xs">{btn.label}</span>
        </button>
      ))}
      
      <button
        onClick={onOpenDrawer}
        className="col-span-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <DoorOpen className="w-5 h-5" />
        <span>Odpri predal</span>
      </button>
    </div>
  );
};

export default ActionButtons;
