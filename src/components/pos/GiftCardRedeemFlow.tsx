import { useState, useEffect, useRef } from "react";
import { Delete, Loader2, CreditCard, Lock, Gift, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GiftCardRedeemFlowProps {
  total: number;
  registerId: number;
  onApplyDiscount: (pointsUsed: number, discountAmount: number, cardId: string) => void;
  onPayWithBalance: (cardId: string, amount: number) => void;
  onPartialBalancePayment: (cardId: string, cardAmount: number, remainingTotal: number) => void;
  onCancel: () => void;
}

type Step = 'enter_code' | 'loading' | 'waiting_pin' | 'pin_approved' | 'pin_declined' | 'show_points' | 'confirm';

const POINT_VALUE = 0.01; // 1 point = 0.01 €
const MIN_PURCHASE_FOR_POINTS = 5; // min 5€ purchase to use points

const GiftCardRedeemFlow = ({ total, registerId, onApplyDiscount, onPayWithBalance, onPartialBalancePayment, onCancel }: GiftCardRedeemFlowProps) => {
  const [step, setStep] = useState<Step>('enter_code');
  const [code, setCode] = useState("");
  const [card, setCard] = useState<any>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [manualPointsInput, setManualPointsInput] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [error, setError] = useState("");
  const [pinRequestId, setPinRequestId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxRedeemablePoints = card ? Math.min(
    card.points || 0,
    Math.floor(total / POINT_VALUE)
  ) : 0;
  const discountAmount = pointsToUse * POINT_VALUE;
  const remainingTotal = total - discountAmount;

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  const bg = "linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)";

  // Listen for PIN verification result from terminal
  useEffect(() => {
    if (step !== 'waiting_pin' || !pinRequestId) return;

    const channel = supabase
      .channel(`pin-verify-${pinRequestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'terminal_requests',
      }, (payload) => {
        const req = payload.new as any;
        if (req.id === pinRequestId) {
          if (req.status === 'approved') {
            setStep('show_points');
            toast.success('PIN koda potrjena na terminalu');
          } else if (req.status === 'declined') {
            setError('PIN koda zavrnjena na terminalu.');
            setStep('enter_code');
            setCode("");
            setCard(null);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [step, pinRequestId]);

  const handleLookupCard = async () => {
    if (code.length < 4) return;
    setStep('loading');
    setError("");

    let { data: foundCard } = await supabase.from('gift_cards').select('*').eq('code', code).eq('active', true).single();
    if (!foundCard) {
      const { data: byEan } = await supabase.from('gift_cards').select('*').eq('ean', code).eq('active', true).single();
      foundCard = byEan;
    }

    if (!foundCard) {
      setError("Kartica ni najdena ali ni aktivna.");
      setStep('enter_code');
      return;
    }

    setCard(foundCard);

    // If card has a PIN, send PIN verify request to POS terminal
    if ((foundCard as any).pin && (foundCard as any).pin.length > 0) {
      const { data: req } = await supabase.from('terminal_requests').insert({
        register_id: registerId,
        amount: 0,
        status: 'pending',
        type: 'pin_verify',
        metadata: { card_id: (foundCard as any).id, card_code: (foundCard as any).code },
      } as any).select().single();

      if (req) {
        setPinRequestId((req as any).id);
        setStep('waiting_pin');
      } else {
        setError("Napaka pri pošiljanju zahteve na terminal.");
        setStep('enter_code');
      }
    } else {
      setStep('show_points');
    }
  };

  const handleCancelPinRequest = async () => {
    if (pinRequestId) {
      await supabase.from('terminal_requests').update({ status: 'cancelled' } as any).eq('id', pinRequestId);
    }
    setPinRequestId(null);
    setStep('enter_code');
    setCode("");
    setCard(null);
  };

  const handleConfirmPoints = () => {
    if (pointsToUse > 0 && card) {
      onApplyDiscount(pointsToUse, discountAmount, card.id);
    }
  };

  const handlePayBalance = () => {
    if (card && card.balance >= total) {
      onPayWithBalance(card.id, total);
    }
  };

  // Numpad renderer
  const renderNumpad = (onKey: (k: string) => void, onDel: () => void, showComma = false) => (
    <div className="flex flex-col gap-1.5 flex-1">
      {numKeys.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 flex-1">
          {row.map(key => (
            <button key={key} onClick={() => onKey(key)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1.5 flex-1">
        <button onClick={() => onKey('0')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">0</button>
        {showComma ? (
          <button onClick={() => onKey(',')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">,</button>
        ) : (
          <button className="flex-1 bg-gray-200 border border-gray-300 rounded-lg font-bold text-2xl text-gray-400 cursor-default" />
        )}
        <button onClick={onDel} className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
          <Delete className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );

  // STEP 1: Enter card code
  if (step === 'enter_code' || step === 'loading') {
    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">Darilna kartica</span>
          </div>
          <div className="border-t border-dashed border-gray-400 pt-2" />
          <div>Skupaj za plačilo: <strong>{formatPrice(total)} €</strong></div>
          <p className="text-gray-500 text-xs mt-4">Vnesite 8-mestno kodo kartice ali skenirajte EAN črtno kodo.</p>
          {error && (
            <div className="bg-red-100 border border-red-400 rounded p-3 text-red-700 font-bold text-sm">
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="flex-[6] flex flex-col gap-3">
          <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
            <h3 className="font-bold text-base mb-2">Koda darilne kartice:</h3>
            <div className="border-2 border-gray-600 bg-gray-50 rounded-lg p-3 font-mono text-xl min-h-[2rem]">
              {step === 'loading' ? <Loader2 className="w-5 h-5 animate-spin inline" /> : code}
            </div>
          </div>

          <div className="flex gap-3 flex-1">
            {renderNumpad(
              k => { if (step !== 'loading') setCode(prev => prev + k); },
              () => { if (step !== 'loading') setCode(prev => prev.slice(0, -1)); }
            )}
            <div className="flex flex-col gap-3 w-36">
              <button onClick={onCancel}
                className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
                ← Nazaj
              </button>
              <button onClick={handleLookupCard}
                disabled={code.length < 4 || step === 'loading'}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center disabled:opacity-40 transition-colors p-2">
                {step === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Potrdi\nkartico'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Enter PIN
  if (step === 'enter_pin') {
    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-600" />
            <span className="font-bold text-lg">Preverjanje PIN kode</span>
          </div>
          <div className="border-t border-dashed border-gray-400 pt-2" />
          <div>Kartica: <strong>{card?.code}</strong></div>
          <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-800 text-sm mt-4">
            🔒 Stranka naj vnese svojo PIN kodo za potrditev dostopa do točk.
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 rounded p-3 text-red-700 font-bold text-sm mt-2">
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="flex-[6] flex flex-col gap-3">
          <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
            <h3 className="font-bold text-base mb-2">PIN koda:</h3>
            <div className="border-2 border-gray-600 bg-gray-50 rounded-lg p-3 font-mono text-3xl min-h-[2.5rem] tracking-[0.5em] text-center">
              {'●'.repeat(pin.length)}
            </div>
          </div>

          <div className="flex gap-3 flex-1">
            {renderNumpad(
              k => setPin(prev => prev.length < 6 ? prev + k : prev),
              () => setPin(prev => prev.slice(0, -1))
            )}
            <div className="flex flex-col gap-3 w-36">
              <button onClick={() => { setStep('enter_code'); setPin(''); setError(''); }}
                className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
                ← Nazaj
              </button>
              <button onClick={handleVerifyPin}
                disabled={pin.length < 1}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center disabled:opacity-40 transition-colors p-2">
                Potrdi PIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Show points & select redemption
  if (step === 'show_points') {
    const canUsePoints = total >= MIN_PURCHASE_FOR_POINTS && (card?.points || 0) > 0;
    const presets = [10, 25, 50, 100, 250, 500].filter(p => p <= maxRedeemablePoints);
    const cardBalance = card?.balance || 0;
    const canPayFull = cardBalance >= total;
    const canPayPartial = cardBalance > 0 && cardBalance < total;

    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        {/* LEFT - Card info */}
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-3 overflow-y-auto">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-green-600" />
            <span className="font-bold text-lg">Stanje kartice</span>
          </div>
          <div className="border-t border-dashed border-gray-400 pt-2" />
          <div>Kartica: <strong>{card?.code}</strong></div>
          <div className="border-t border-dashed border-gray-400 pt-2" />

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span>Stanje (€):</span>
              <strong className="text-blue-700">{formatPrice(cardBalance)} €</strong>
            </div>
            <div className="flex justify-between">
              <span>Točke:</span>
              <strong className="text-green-700">{card?.points || 0}</strong>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs space-y-1 mt-2">
            <div className="font-bold mb-1">Pravila koriščenja:</div>
            <div>• 1 točka = {formatPrice(POINT_VALUE)} €</div>
            <div>• Min. znesek računa: {formatPrice(MIN_PURCHASE_FOR_POINTS)} €</div>
            <div>• Maks. za ta račun: {maxRedeemablePoints} točk ({formatPrice(maxRedeemablePoints * POINT_VALUE)} €)</div>
          </div>

          {!canUsePoints && (card?.points || 0) > 0 && total < MIN_PURCHASE_FOR_POINTS && (
            <div className="bg-amber-50 border border-amber-300 rounded p-2 text-amber-700 text-xs">
              ⚠ Znesek računa je premajhen za koriščenje točk (min. {formatPrice(MIN_PURCHASE_FOR_POINTS)} €).
            </div>
          )}
        </div>

        {/* RIGHT - Points selection + balance */}
        <div className="flex-[6] flex flex-col gap-3 overflow-y-auto">
          <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
            <h3 className="font-bold text-base mb-1">Za plačilo: {formatPrice(total)} €</h3>
            {pointsToUse > 0 && (
              <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1 text-sm">
                <div className="text-green-700 font-bold">Popust iz točk: -{formatPrice(discountAmount)} € ({pointsToUse} točk)</div>
                <div className="font-bold text-lg">Preostanek: {formatPrice(remainingTotal)} €</div>
              </div>
            )}
          </div>

          {canUsePoints && (
            <div className="border-2 border-gray-600 bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">Število točk:</h4>
                <button onClick={() => { setUseManualInput(!useManualInput); setManualPointsInput(""); }}
                  className="text-xs px-3 py-1 rounded border border-gray-400 hover:bg-gray-100 transition-colors font-medium">
                  {useManualInput ? "Prednastavitve" : "Ročni vnos"}
                </button>
              </div>

              {useManualInput ? (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 border-2 border-gray-600 bg-gray-50 rounded-lg p-2 font-mono text-lg min-h-[2rem]">
                      {manualPointsInput || "0"}
                    </div>
                    <span className="text-sm text-gray-500">/ {maxRedeemablePoints}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {['7','8','9','4','5','6','1','2','3'].map(k => (
                      <button key={k} onClick={() => {
                        const next = manualPointsInput + k;
                        const val = parseInt(next);
                        if (val <= maxRedeemablePoints) { setManualPointsInput(next); setPointsToUse(val); }
                      }} className="h-10 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded font-bold text-lg text-gray-700 transition-colors">{k}</button>
                    ))}
                    <button onClick={() => {
                      const next = manualPointsInput + '0';
                      const val = parseInt(next);
                      if (val <= maxRedeemablePoints) { setManualPointsInput(next); setPointsToUse(val); }
                    }} className="h-10 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded font-bold text-lg text-gray-700 transition-colors">0</button>
                    <button onClick={() => {
                      const next = manualPointsInput.slice(0, -1);
                      setManualPointsInput(next);
                      setPointsToUse(parseInt(next) || 0);
                    }} className="h-10 bg-red-500 hover:bg-red-600 border border-red-600 rounded flex items-center justify-center transition-colors">
                      <Delete className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => { setManualPointsInput(String(maxRedeemablePoints)); setPointsToUse(maxRedeemablePoints); }}
                      className="h-10 bg-green-600 hover:bg-green-700 text-white border border-green-700 rounded font-bold text-xs transition-colors col-span-3">
                      Vse ({maxRedeemablePoints})
                    </button>
                    <button onClick={() => { setManualPointsInput(""); setPointsToUse(0); }}
                      className="h-10 bg-gray-500 hover:bg-gray-600 text-white border border-gray-600 rounded font-bold text-xs transition-colors col-span-3">
                      Počisti
                    </button>
                  </div>
                  {manualPointsInput && parseInt(manualPointsInput) > 0 && (
                    <div className="text-sm text-green-700 font-medium">
                      = {formatPrice((parseInt(manualPointsInput) || 0) * POINT_VALUE)} € popust
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {presets.map(p => (
                    <button key={p} onClick={() => setPointsToUse(p)}
                      className={`h-12 rounded-lg font-bold text-base border-2 transition-colors ${
                        pointsToUse === p 
                          ? 'bg-green-600 text-white border-green-700' 
                          : 'bg-white hover:bg-green-50 border-gray-400 text-gray-700'
                      }`}>
                      {p} ({formatPrice(p * POINT_VALUE)} €)
                    </button>
                  ))}
                  {maxRedeemablePoints > 0 && !presets.includes(maxRedeemablePoints) && (
                    <button onClick={() => setPointsToUse(maxRedeemablePoints)}
                      className={`h-12 rounded-lg font-bold text-base border-2 transition-colors ${
                        pointsToUse === maxRedeemablePoints 
                          ? 'bg-green-600 text-white border-green-700' 
                          : 'bg-white hover:bg-green-50 border-gray-400 text-gray-700'
                      }`}>
                      Vse: {maxRedeemablePoints}
                    </button>
                  )}
                  <button onClick={() => setPointsToUse(0)}
                    className={`h-12 rounded-lg font-bold text-base border-2 transition-colors ${
                      pointsToUse === 0 
                        ? 'bg-gray-600 text-white border-gray-700' 
                        : 'bg-white hover:bg-gray-50 border-gray-400 text-gray-700'
                    }`}>
                    Brez točk
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <div className="flex-1" />
            <div className="flex flex-col gap-2 w-44">
              <button onClick={onCancel}
                className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
                ← Nazaj
              </button>

              {canUsePoints && pointsToUse > 0 && (
                <button onClick={handleConfirmPoints}
                  className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center transition-colors p-2">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  Uporabi {pointsToUse} točk
                </button>
              )}

              {canPayFull && (
                <button onClick={handlePayBalance}
                  className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center transition-colors p-2">
                  Plačaj s stanjem<br/>({formatPrice(cardBalance)} €)
                </button>
              )}

              {canPayPartial && (
                <button onClick={() => onPartialBalancePayment(card.id, cardBalance, total - cardBalance)}
                  className="h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center justify-center text-center transition-colors p-2 leading-tight">
                  Delno plačilo<br/>{formatPrice(cardBalance)} € s kartice<br/>+ {formatPrice(total - cardBalance)} € ostalo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GiftCardRedeemFlow;
