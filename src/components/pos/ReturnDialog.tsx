import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, RotateCcw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReturnDialogProps {
  onConfirm: (ean: string, quantity: number, price: number) => void;
  onClose: () => void;
}

interface FoundReceipt {
  receipt_number: string;
  items: any[];
  total: number;
  created_at: string;
  cashier_name: string;
}

const ReturnDialog = ({ onConfirm, onClose }: ReturnDialogProps) => {
  const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');
  const [searchValue, setSearchValue] = useState("");
  const [foundReceipts, setFoundReceipts] = useState<FoundReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<FoundReceipt | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchValue) return;
    setSearching(true);
    const { data } = await supabase.from('transactions')
      .select('*')
      .eq('receipt_number', searchValue as any)
      .eq('voided', false as any);
    
    if (data && data.length > 0) {
      setFoundReceipts(data as any[]);
      setStep('select');
    } else {
      // Try partial search
      const { data: partial } = await supabase.from('transactions')
        .select('*')
        .ilike('receipt_number', `%${searchValue}%` as any)
        .eq('voided', false as any)
        .limit(10);
      if (partial && partial.length > 0) {
        setFoundReceipts(partial as any[]);
        setStep('select');
      } else {
        setFoundReceipts([]);
      }
    }
    setSearching(false);
  };

  const handleKeyPress = (key: string) => {
    if (step === 'search') {
      setSearchValue(prev => prev + key);
    } else if (step === 'confirm') {
      if (key === '.') return;
      setReturnQuantity(prev => prev === '1' ? key : prev + key);
    }
  };

  const handleDelete = () => {
    if (step === 'search') {
      setSearchValue(prev => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setReturnQuantity(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
    }
  };

  const handleSelectItem = (receiptIdx: number, itemIdx: number) => {
    const receipt = foundReceipts[receiptIdx];
    setSelectedReceipt(receipt);
    setSelectedItemIndex(itemIdx);
    setStep('confirm');
  };

  const handleConfirmReturn = () => {
    if (!selectedReceipt || selectedItemIndex === null) return;
    const item = selectedReceipt.items[selectedItemIndex];
    const qty = parseInt(returnQuantity) || 1;
    if (qty > 0 && item) {
      onConfirm(item.ean, qty, item.price);
      onClose();
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-500" />
            {step === 'search' ? 'Iskanje računa za vračilo' : step === 'select' ? 'Izberite artikel za vračilo' : 'Potrdite vračilo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-500/10 text-orange-600 p-3 rounded-lg text-center text-sm">
            Vnašanje vračila - poiščite račun in izberite artikel
          </div>

          {step === 'search' && (
            <>
              <div className="text-center text-2xl font-bold py-4 bg-muted rounded-lg font-mono">
                {searchValue || 'Vnesite št. računa'}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {keys.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    disabled={key === '.'}
                    className="h-14 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleDelete}
                  className="h-14 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 transition-colors">
                  <Delete className="w-5 h-5" />
                  <span>Briši</span>
                </button>
                <button onClick={handleSearch} disabled={!searchValue || searching}
                  className="h-14 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
                  <Search className="w-5 h-5" />
                  <span>{searching ? 'Iščem...' : 'Poišči račun'}</span>
                </button>
              </div>

              {foundReceipts.length === 0 && searchValue && !searching && (
                <p className="text-center text-sm text-muted-foreground">Račun ni najden</p>
              )}
            </>
          )}

          {step === 'select' && (
            <>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {foundReceipts.map((receipt, ri) => (
                  <div key={ri} className="border rounded-lg p-3">
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span>Račun #{receipt.receipt_number}</span>
                      <span>{new Date(receipt.created_at).toLocaleDateString('sl-SI')}</span>
                    </div>
                    {receipt.items.map((item: any, ii: number) => (
                      <button key={ii} onClick={() => handleSelectItem(ri, ii)}
                        className="w-full flex justify-between text-sm py-1 px-2 hover:bg-orange-50 rounded transition-colors">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatPrice(item.price)} €</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('search')}
                className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors">
                ← Nazaj na iskanje
              </button>
            </>
          )}

          {step === 'confirm' && selectedReceipt && selectedItemIndex !== null && (
            <>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm"><strong>Račun:</strong> #{selectedReceipt.receipt_number}</p>
                <p className="text-sm"><strong>Artikel:</strong> {selectedReceipt.items[selectedItemIndex].name}</p>
                <p className="text-sm"><strong>Cena:</strong> {formatPrice(selectedReceipt.items[selectedItemIndex].price)} €</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Količina za vračilo:</p>
                <div className="text-4xl font-bold py-2">{returnQuantity}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {keys.map((key) => (
                  <button key={key} onClick={() => handleKeyPress(key)}
                    disabled={key === '.'}
                    className="h-12 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30">
                    {key}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleDelete}
                  className="h-14 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 transition-colors">
                  <Delete className="w-5 h-5" />
                  <span>Briši</span>
                </button>
                <button onClick={handleConfirmReturn}
                  className="h-14 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 transition-colors">
                  <CornerDownLeft className="w-5 h-5" />
                  <span>Potrdi vračilo</span>
                </button>
              </div>
              
              <button onClick={() => setStep('select')}
                className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors">
                ← Nazaj
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDialog;
