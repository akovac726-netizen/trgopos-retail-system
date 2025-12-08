import { ChevronUp, ChevronDown } from "lucide-react";
import { CartItem } from "@/types/pos";
import { useRef, useState } from "react";

interface CartItemListProps {
  items: CartItem[];
  selectedIndex: number | null;
  onSelectItem: (index: number) => void;
}

const CartItemList = ({ items, selectedIndex, onSelectItem }: CartItemListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  const scrollUp = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ top: -150, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ top: 150, behavior: 'smooth' });
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-secondary/50 border-b border-border text-sm font-semibold text-muted-foreground">
        <div className="col-span-1">#</div>
        <div className="col-span-2">EAN</div>
        <div className="col-span-4">Artikel</div>
        <div className="col-span-2 text-right">Cena</div>
        <div className="col-span-1 text-center">Kol.</div>
        <div className="col-span-2 text-right">Znesek</div>
      </div>

      {/* Items */}
      <div 
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Skenirajte artikel ali vnesite EAN kodo</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(index)}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border cursor-pointer transition-colors ${
                selectedIndex === index 
                  ? 'bg-pos-item-selected' 
                  : index % 2 === 0 
                    ? 'bg-pos-item-bg' 
                    : 'bg-pos-item-alt'
              } hover:bg-accent/50`}
            >
              <div className="col-span-1 font-mono text-muted-foreground">
                {index + 1}
              </div>
              <div className="col-span-2 font-mono text-xs">
                {item.ean}
              </div>
              <div className="col-span-4 font-medium truncate">
                {item.name}
                {item.discount && (
                  <span className="ml-2 text-xs text-destructive">-{item.discount}%</span>
                )}
              </div>
              <div className="col-span-2 text-right font-mono">
                {item.originalPrice && item.originalPrice !== item.price ? (
                  <div className="flex flex-col">
                    <span className="line-through text-xs text-muted-foreground">
                      {formatPrice(item.originalPrice)}
                    </span>
                    <span>{formatPrice(item.price)}</span>
                  </div>
                ) : (
                  formatPrice(item.price)
                )}
              </div>
              <div className="col-span-1 text-center font-semibold">
                {item.quantity}
              </div>
              <div className="col-span-2 text-right font-mono font-semibold">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scroll buttons */}
      <div className="flex border-t border-border">
        <button
          onClick={scrollUp}
          disabled={!canScrollUp}
          className="flex-1 py-3 flex items-center justify-center border-r border-border hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={scrollDown}
          disabled={!canScrollDown}
          className="flex-1 py-3 flex items-center justify-center hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CartItemList;
