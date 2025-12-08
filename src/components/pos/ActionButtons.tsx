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
  Lock
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
  hasItems: boolean;
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
  hasItems,
  isAdmin
}: ActionButtonsProps) => {
  const actionButtons = [
    { label: "Popust %", icon: Percent, onClick: onDiscount, disabled: !hasItems },
    { label: "Pop. artikel", icon: Tag, onClick: onItemDiscount, disabled: !hasItems },
    { label: "Nova cena", icon: Tag, onClick: onPriceChange, disabled: !hasItems },
    { label: "Odlog", icon: Clock, onClick: onDelayPayment, disabled: !hasItems },
    { label: "Storno art.", icon: XCircle, onClick: onVoidItem, disabled: !hasItems },
    { label: "Storno vse", icon: Trash2, onClick: onVoidTransaction, disabled: !hasItems },
    { label: "Vračilo", icon: RotateCcw, onClick: onReturn },
    { label: "Kartica", icon: CreditCard, onClick: onLoyaltyCard },
    { label: "Info cena", icon: Info, onClick: onPriceCheck },
    { label: "Kupon", icon: Ticket, onClick: onCoupon },
    { label: "Kopija", icon: Receipt, onClick: onReceipt },
    { label: "Embalaža", icon: Package, onClick: onPackaging },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actionButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className="pos-btn-action h-16 flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <btn.icon className="w-5 h-5" />
          <span className="text-sm">{btn.label}</span>
        </button>
      ))}
      
      <button
        onClick={onVatReceipt}
        disabled={!hasItems}
        className="col-span-2 pos-btn-secondary h-14 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileText className="w-5 h-5" />
        <span>DDV Račun</span>
      </button>
      
      <button
        onClick={onOpenDrawer}
        className="col-span-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 h-14 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <DoorOpen className="w-5 h-5" />
        <span>Odpri predal</span>
      </button>
      
      <button
        onClick={isAdmin ? onInventory : undefined}
        disabled={!isAdmin}
        className={`h-14 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
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
        className="bg-primary/10 hover:bg-primary/20 text-primary h-14 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <History className="w-5 h-5" />
        <span>Transakcije</span>
      </button>

      {isAdmin && (
        <button
          onClick={onReports}
          className="col-span-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-600 h-14 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Poročila prodaje</span>
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
