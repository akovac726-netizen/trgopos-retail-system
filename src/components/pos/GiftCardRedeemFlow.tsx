import { useState } from "react";
import { Delete, Loader2, CreditCard, Lock, Gift, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GiftCardRedeemFlowProps {
  total: number;
  onApplyDiscount: (pointsUsed: number, discountAmount: number, cardId: string) => void;
  onPayWithBalance: (cardId: string, amount: number) => void;
  onCancel: () => void;
}

type Step = 'enter_code' | 'loading' | 'enter_pin' | 'show_points' | 'confirm';

const POINT_VALUE = 0.01; // 1 point = 0.01 €
const MIN_PURCHASE_FOR_POINTS = 5; // min 5€ purchase to use points

const GiftCardRedeemFlow = ({ total, onApplyDiscount, onPayWithBalance, onCancel }: GiftCardRedeemFlowProps) => {
  const [step, setStep] = useState<Step>('enter_code');
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [card, setCard] = useState<any>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [error, setError] = useState("");

  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxRedeemablePoints = card ? Math.min(
    card.points || 0,
    Math.floor(total / POINT_VALUE) // can't discount more than total
  ) : 0;
  const discountAmount = pointsToUse * POINT_VALUE;
  const remainingTotal = total - discountAmount;

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  const bg = "linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)";

  const handleLookupCard = async () => {
    if (code.length < 4) return;
    setStep('loading');
    setError("");

    // Try by code first, then by EAN
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

    // If card has a PIN set, require PIN entry
    if ((foundCard as any).pin && (foundCard as any).pin.length > 0) {
      setStep('enter_pin');
    } else {
      // No PIN, go directly to points
      setStep('show_points');
    }
  };

  const handleVerifyPin = () => {
    if (!card) return;
    if (pin === card.pin) {
      setError("");
      setStep('show_points');
    } else {
      setError("Napačna PIN koda. Poskusite znova.");
      setPin("");
    }
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

    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        {/* LEFT - Card info */}
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-3">
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
              <strong className="text-blue-700">{formatPrice(card?.balance || 0)} €</strong>
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

        {/* RIGHT - Points selection */}
        <div className="flex-[6] flex flex-col gap-3">
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
            <>
              <div className="border-2 border-gray-600 bg-white rounded-lg p-3">
                <h4 className="font-bold text-sm mb-2">Izberi število točk:</h4>
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
                  {/* All points button */}
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
              </div>
            </>
          )}

          <div className="flex gap-3 flex-1">
            <div className="flex-1" />
            <div className="flex flex-col gap-3 w-44">
              <button onClick={onCancel}
                className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
                ← Nazaj
              </button>

              {canUsePoints && pointsToUse > 0 && (
                <button onClick={handleConfirmPoints}
                  className="h-16 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center transition-colors p-2">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  Uporabi {pointsToUse} točk
                </button>
              )}

              {card?.balance >= total && (
                <button onClick={handlePayBalance}
                  className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center transition-colors p-2">
                  Plačaj s stanjem<br/>({formatPrice(card.balance)} €)
                </button>
              )}

              {(!canUsePoints || pointsToUse === 0) && card?.balance < total && (
                <div className="text-center text-gray-500 text-xs mt-2">
                  Izberite točke ali se vrnite nazaj.
                </div>
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
