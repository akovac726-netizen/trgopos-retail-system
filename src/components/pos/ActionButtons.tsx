import { 
  Percent, 
  Tag, 
  Clock, 
  XCircle, 
  Trash2, 
  RotateCcw, 
  CreditCard, 
  Info, 
  Ticket,
  Receipt,
  Package,
  FileText,
  Warehouse,
  DoorOpen,
  History,
  BarChart3,
  Lock,
  Search,
  Scale,
  Cookie,
  Hash
} from "lucide-react";

interface ActionButtonsProps {
  onDiscount: () => void;
  onItemDiscount: () => void;
  onPriceChange: () => void;
  onDelayPayment: () => void;
  onVoidItem: () => void;
  onVoidTransaction: () => void;
  onReturn: () => void;
  onLoyaltyCard: () => void;
  onPriceCheck: () => void;
  onCoupon: () => void;
  onReceipt: () => void;
  onPackaging: () => void;
  onVatReceipt: () => void;
  onInventory: () => void;
  onOpenDrawer: () => void;
  onTransactions: () => void;
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
  onItemDiscount,
  onPriceChange,
  onDelayPayment,
  onVoidItem,
  onVoidTransaction,
  onReturn,
  onLoyaltyCard,
  onPriceCheck,
  onCoupon,
  onReceipt,
  onPackaging,
  onVatReceipt,
  onInventory,
  onOpenDrawer,
  onTransactions,
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
    { label: "Popust %", icon: Percent, onClick: onDiscount, disabled: !hasItems },
    { label: "Pop. artikel", icon: Tag, onClick: onItemDiscount, disabled: !hasSelectedItem },
    { label: "Nova cena", icon: Tag, onClick: onPriceChange, disabled: !hasSelectedItem },
    { label: "Storno", icon: XCircle, onClick: onStorno, disabled: !hasItems, className: "bg-red-500/20 hover:bg-red-500/30 text-red-600" },
    { label: "Storno vse", icon: Trash2, onClick: onVoidTransaction, disabled: !hasItems },
    { label: "Vračilo", icon: RotateCcw, onClick: onReturn, className: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-600" },
    { label: "Kartica", icon: CreditCard, onClick: onLoyaltyCard },
    { label: "Info cena", icon: Info, onClick: onPriceCheck },
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
        onClick={onVatReceipt}
        disabled={!hasItems}
        className="col-span-2 pos-btn-secondary h-12 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileText className="w-5 h-5" />
        <span>DDV Račun / Faktura</span>
      </button>
      
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
      
      <button
        onClick={onTransactions}
        className="bg-primary/10 hover:bg-primary/20 text-primary h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <History className="w-5 h-5" />
        <span>Transakcije</span>
      </button>

      {isAdmin && (
        <button
          onClick={onReports}
          className="col-span-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Poročila prodaje</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
