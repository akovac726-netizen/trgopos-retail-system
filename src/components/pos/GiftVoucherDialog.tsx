import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Gift, CreditCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface GiftVoucherDialogProps {
  onConfirm: (code: string, amount: number, type: 'use' | 'sell') => void;
  onClose: () => void;
}

const GiftVoucherDialog = ({ onConfirm, onClose }: GiftVoucherDialogProps) => {
  const [tab, setTab] = useState<'use' | 'sell'>('use');
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<'code' | 'amount'>('code');

  const handleKeyPress = (key: string) => {
    if (step === 'code') {
      if (code.length < 16) {
        setCode(prev => prev + key);
      }
    } else {
      if (key === '.' && amount.includes('.')) return;
      setAmount(prev => prev === '0' ? key : prev + key);
    }
  };

  const handleDelete = () => {
    if (step === 'code') {
      setCode(prev => prev.slice(0, -1));
    } else {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
  };

  const handleConfirm = () => {
    if (tab === 'use') {
      if (code.length >= 4) {
        // In real system, would validate code and get amount from database
        onConfirm(code, 0, 'use');
        onClose();
      }
    } else {
      if (step === 'code' && code.length >= 4) {
        setStep('amount');
      } else if (step === 'amount') {
        const amountNum = parseFloat(amount);
        if (amountNum > 0) {
          onConfirm(code, amountNum, 'sell');
          onClose();
        }
      }
    }
  };

  const quickAmounts = [10, 20, 25, 50, 100, 200];
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Darilni bon
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'use' | 'sell'); setStep('code'); setCode(''); setAmount(''); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="use">Uporabi bon</TabsTrigger>
            <TabsTrigger value="sell">Prodaj bon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="use" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground text-center">
              Vnesite kodo darilnega bona
            </div>
            
            <div className="text-center text-2xl font-bold py-4 bg-muted rounded-lg font-mono">
              {code || '________________'}
            </div>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground text-center">
              {step === 'code' ? 'Vnesite kodo novega bona' : 'Vnesite vrednost bona'}
            </div>

            {step === 'code' && (
              <div className="text-center text-2xl font-bold py-4 bg-muted rounded-lg font-mono">
                {code || '________________'}
              </div>
            )}

            {step === 'amount' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        onConfirm(code, amt, 'sell');
                        onClose();
                      }}
                      className="h-12 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                    >
                      {amt} €
                    </button>
                  ))}
                </div>
                
                <div className="text-center text-3xl font-bold py-4 bg-muted rounded-lg">
                  {amount || '0'} €
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={step === 'code' && key === '.'}
                className="h-14 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30"
              >
                {key}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDelete}
              className="h-14 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Delete className="w-5 h-5" />
              <span>Briši</span>
            </button>
            <button
              onClick={handleConfirm}
              disabled={code.length < 4}
              className="h-14 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <CornerDownLeft className="w-5 h-5" />
              <span>{tab === 'use' ? 'Uporabi' : (step === 'code' ? 'Naprej' : 'Potrdi')}</span>
            </button>
          </div>
          
          {step === 'amount' && (
            <button
              onClick={() => setStep('code')}
              className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Nazaj na kodo
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftVoucherDialog;
