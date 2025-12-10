import { 
  Percent, 
  XCircle, 
  Trash2, 
  RotateCcw, 
  Tag,
  Warehouse,
  DoorOpen,
  BarChart3,
  Lock,
  Search,
  Scale,
  Cookie,
  Hash,
  Gift,
  Receipt
} from "lucide-react";

interface ActionButtonsProps {
  onDiscount: () => void;
  onVoidTransaction: () => void;
  onReturn: () => void;
  onPriceCheck: () => void;
  onWeightCheck: () => void;
  onGiftVoucher: () => void;
  onReceipts: () => void;
  onInventory: () => void;
  onOpenDrawer: () => void;
  onReports: () => void;
  onProductSearch: () => void;
  onWeighing: () => void;
  onBakery: () => void;
  onQuantity: () => void;
  onStorno: () => void;
  hasItems: boolean;
  hasSelectedItem: boolean;
  isAdmin: boolean;
}

const ActionButtons = ({
  onDiscount,
  onVoidTransaction,
  onReturn,
  onPriceCheck,
  onWeightCheck,
  onGiftVoucher,
  onReceipts,
  onInventory,
  onOpenDrawer,
  onReports,
  onProductSearch,
  onWeighing,
  onBakery,
  onQuantity,
  onStorno,
  hasItems,
  hasSelectedItem,
  isAdmin
}: ActionButtonsProps) => {
  const actionButtons = [
    { label: "Iskanje", icon: Search, onClick: onProductSearch, className: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-600" },
    { label: "Tehtanje", icon: Scale, onClick: onWeighing, className: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600" },
    { label: "Dopeka", icon: Cookie, onClick: onBakery, className: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-600" },
    { label: "Količina", icon: Hash, onClick: onQuantity, disabled: !hasSelectedItem, className: "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600" },
    { label: "Popust", icon: Percent, onClick: onDiscount, disabled: !hasItems, className: "bg-violet-500/20 hover:bg-violet-500/30 text-violet-600" },
    { label: "Storno", icon: XCircle, onClick: onStorno, disabled: !hasItems, className: "bg-red-500/20 hover:bg-red-500/30 text-red-600" },
    { label: "Storno vse", icon: Trash2, onClick: onVoidTransaction, disabled: !hasItems, className: "bg-red-500/20 hover:bg-red-500/30 text-red-600" },
    { label: "Vračilo", icon: RotateCcw, onClick: onReturn, className: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-600" },
    { label: "Preveri ceno", icon: Tag, onClick: onPriceCheck, className: "bg-teal-500/20 hover:bg-teal-500/30 text-teal-600" },
    { label: "Preveri težo", icon: Scale, onClick: onWeightCheck, className: "bg-lime-500/20 hover:bg-lime-500/30 text-lime-600" },
    { label: "Darilni bon", icon: Gift, onClick: onGiftVoucher, className: "bg-pink-500/20 hover:bg-pink-500/30 text-pink-600" },
    { label: "Računi", icon: Receipt, onClick: onReceipts, className: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actionButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={`h-14 flex flex-col items-center justify-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            btn.className || 'pos-btn-action'
          }`}
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
      
      <button
        onClick={isAdmin ? onInventory : undefined}
        disabled={!isAdmin}
        className={`h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          isAdmin 
            ? 'bg-primary/10 hover:bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
        title={!isAdmin ? 'Samo za administratorje' : undefined}
      >
        {!isAdmin && <Lock className="w-4 h-4" />}
        <Warehouse className="w-5 h-5" />
        <span>Zaloge</span>
      </button>

      {isAdmin && (
        <button
          onClick={onReports}
          className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Poročila</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
