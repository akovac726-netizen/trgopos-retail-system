interface TotalDisplayProps {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

const TotalDisplay = ({ subtotal, discount, total, itemCount }: TotalDisplayProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="pos-panel p-4 space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Artiklov: {itemCount}</span>
        <span>Vmesni seštevek</span>
      </div>
      
      <div className="flex justify-between items-baseline">
        <span className="text-muted-foreground">Seštevek:</span>
        <span className="font-mono text-xl">{formatPrice(subtotal)} €</span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between items-baseline text-destructive">
          <span>Popust:</span>
          <span className="font-mono text-xl">-{formatPrice(discount)} €</span>
        </div>
      )}
      
      <div className="border-t border-border pt-3">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-semibold">SKUPAJ:</span>
          <span className="pos-total-display text-primary">{formatPrice(total)} €</span>
        </div>
      </div>
    </div>
  );
};

export default TotalDisplay;
