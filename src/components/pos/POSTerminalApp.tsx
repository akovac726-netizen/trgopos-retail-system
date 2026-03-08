import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle2, XCircle, Wifi, WifiOff, ArrowLeft, Lock, Delete, Loader2, Nfc } from "lucide-react";

interface TerminalRequest {
  id: string;
  register_id: number;
  amount: number;
  status: string;
  created_at: string;
}

interface POSTerminalAppProps {
  onBack: () => void;
}

type TerminalScreen = 'select-register' | 'idle' | 'card-detected' | 'pin-entry' | 'processing' | 'approved' | 'declined' | 'gift-pin-entry' | 'gift-pin-approved' | 'gift-pin-declined';

const PIN_THRESHOLD = 50; // EUR – above this amount, PIN is required

const POSTerminalApp = ({ onBack }: POSTerminalAppProps) => {
  const [selectedRegister, setSelectedRegister] = useState<number>(0);
  const [screen, setScreen] = useState<TerminalScreen>('select-register');
  const [currentRequest, setCurrentRequest] = useState<TerminalRequest | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [giftPinValue, setGiftPinValue] = useState("");
  const [giftPinError, setGiftPinError] = useState(false);
  const [giftPinAttempts, setGiftPinAttempts] = useState(0);

  const formatPrice = (price: number) =>
    price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Listen for pending terminal requests for selected register
  useEffect(() => {
    if (selectedRegister === 0) return;

    const fetchPending = async () => {
      const { data } = await supabase
        .from('terminal_requests')
        .select('*')
        .eq('status', 'pending')
        .eq('register_id', selectedRegister)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const req = data[0] as any;
        setCurrentRequest(req as TerminalRequest);
        if (req.type === 'pin_verify') {
          setScreen('gift-pin-entry');
          setGiftPinValue("");
          setGiftPinError(false);
          setGiftPinAttempts(0);
        } else {
          setScreen('card-detected');
        }
      }
    };
    fetchPending();

    const channel = supabase
      .channel(`terminal-reg-${selectedRegister}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'terminal_requests',
      }, (payload) => {
        const req = payload.new as any;
        if (req.status === 'pending' && req.register_id === selectedRegister) {
          setCurrentRequest(req as TerminalRequest);
          if (req.type === 'pin_verify') {
            setScreen('gift-pin-entry');
            setGiftPinValue("");
            setGiftPinError(false);
            setGiftPinAttempts(0);
          } else {
            setScreen('card-detected');
            setPinValue("");
            setPinError(false);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'terminal_requests',
      }, (payload) => {
        const req = payload.new as TerminalRequest;
        if (req.status === 'cancelled' && currentRequest?.id === req.id) {
          setCurrentRequest(null);
          setScreen('idle');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRegister]);

  const handleSelectRegister = (id: number) => {
    setSelectedRegister(id);
    setScreen('idle');
  };

  const handleInsertCard = () => {
    if (!currentRequest) return;
    if (currentRequest.amount > PIN_THRESHOLD) {
      setScreen('pin-entry');
      setPinValue("");
      setPinError(false);
    } else {
      // Under threshold – no PIN needed, go straight to processing
      processPayment();
    }
  };

  const handlePinKey = (key: string) => {
    if (pinValue.length < 4) {
      setPinValue(prev => prev + key);
      setPinError(false);
    }
  };

  const handlePinDelete = () => {
    setPinValue(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinConfirm = () => {
    // Simulate PIN validation – any 4-digit PIN is accepted
    if (pinValue.length === 4) {
      processPayment();
    } else {
      setPinError(true);
    }
  };

  const processPayment = useCallback(async () => {
    if (!currentRequest) return;
    setScreen('processing');
    setProcessing(true);

    // Simulate processing delay (like a real terminal)
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    await supabase
      .from('terminal_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('id', currentRequest.id);

    setProcessing(false);
    setScreen('approved');
    setTimeout(() => {
      setCurrentRequest(null);
      setScreen('idle');
    }, 3000);
  }, [currentRequest]);

  const handleDecline = async () => {
    if (!currentRequest) return;
    setProcessing(true);
    await supabase
      .from('terminal_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', currentRequest.id);
    setProcessing(false);
    setScreen('declined');
    setTimeout(() => {
      setCurrentRequest(null);
      setScreen('idle');
    }, 3000);
  };

  // Gift card PIN verification
  const handleGiftPinKey = (key: string) => {
    if (giftPinValue.length < 6) {
      setGiftPinValue(prev => prev + key);
      setGiftPinError(false);
    }
  };

  const handleGiftPinDelete = () => {
    setGiftPinValue(prev => prev.slice(0, -1));
    setGiftPinError(false);
  };

  const handleGiftPinConfirm = async () => {
    if (!currentRequest || giftPinValue.length < 1) return;
    const metadata = (currentRequest as any).metadata;
    if (!metadata?.card_id) return;

    // Look up the card PIN from DB
    const { data: card } = await supabase.from('gift_cards').select('pin').eq('id', metadata.card_id).single();
    if (card && card.pin === giftPinValue) {
      // PIN correct
      await supabase.from('terminal_requests')
        .update({ status: 'approved', responded_at: new Date().toISOString() } as any)
        .eq('id', currentRequest.id);
      setScreen('gift-pin-approved');
      setTimeout(() => { setCurrentRequest(null); setScreen('idle'); }, 3000);
    } else {
      // PIN wrong
      setGiftPinAttempts(prev => prev + 1);
      if (giftPinAttempts >= 2) {
        // 3 failed attempts - decline
        await supabase.from('terminal_requests')
          .update({ status: 'declined', responded_at: new Date().toISOString() } as any)
          .eq('id', currentRequest.id);
        setScreen('gift-pin-declined');
        setTimeout(() => { setCurrentRequest(null); setScreen('idle'); }, 3000);
      } else {
        setGiftPinError(true);
        setGiftPinValue("");
      }
    }
  };

  const handleGiftPinCancel = async () => {
    if (!currentRequest) return;
    await supabase.from('terminal_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() } as any)
      .eq('id', currentRequest.id);
    setScreen('declined');
    setTimeout(() => { setCurrentRequest(null); setScreen('idle'); }, 3000);
  };

  const numKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  // ─── Register Selection ───
  if (screen === 'select-register') {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Nazaj
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black tracking-wide">
              <span className="text-sky-400">Stand</span><span className="text-sky-300">Buy</span>
              <span className="text-orange-400 text-xl ml-1">★</span>
            </h1>
            <p className="text-white/50 text-xs font-medium tracking-[0.3em] mt-1">POS TERMINAL</p>
          </div>

          <p className="text-white/70 text-lg font-medium mb-6">Izberi blagajno za povezavo:</p>

          <div className="flex gap-4">
            {[1, 2, 3].map(id => (
              <button key={id} onClick={() => handleSelectRegister(id)}
                className="w-24 h-24 bg-white/10 hover:bg-white/20 active:bg-white/30 border-2 border-sky-400/50 hover:border-sky-400 rounded-xl text-3xl font-black text-sky-400 transition-all">
                {id}
              </button>
            ))}
          </div>

          <p className="text-white/30 text-xs mt-6">Terminal bo sprejemal plačila samo za izbrano blagajno</p>
        </div>

        <p className="text-center text-[10px] text-white/20 py-3">StandBuy POS Terminal v1.0</p>
      </div>
    );
  }

  // ─── Main Terminal Screen ───
  return (
    <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={() => { setSelectedRegister(0); setScreen('select-register'); setCurrentRequest(null); }}
          className="text-white/70 hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Zamenjaj
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs">Blagajna <strong className="text-sky-400">{selectedRegister}</strong></span>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-[10px] font-medium">Povezan</span>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-xl font-black tracking-wide">
          <span className="text-sky-400">Stand</span><span className="text-sky-300">Buy</span>
          <span className="text-orange-400 text-lg ml-1">★</span>
        </h1>
        <p className="text-white/40 text-[10px] font-medium tracking-[0.3em]">POS TERMINAL – Blagajna {selectedRegister}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">

        {/* ─── IDLE ─── */}
        {screen === 'idle' && (
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center relative">
              <CreditCard className="w-14 h-14 text-sky-400/40" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center border border-sky-400/30">
                <Nfc className="w-4 h-4 text-sky-400/60" />
              </div>
            </div>
            <p className="text-white/50 text-lg font-medium">Čakam na plačilo...</p>
            <p className="text-white/25 text-sm mt-2">Terminal je pripravljen</p>
            <div className="mt-8 flex items-center gap-2 text-white/15 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Poslušam blagajno {selectedRegister}
            </div>
          </div>
        )}

        {/* ─── CARD DETECTED ─── */}
        {screen === 'card-detected' && currentRequest && (
          <div className="w-full max-w-sm animate-fade-in">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-4">
              <p className="text-white/50 text-sm text-center mb-1">NAKUP – Blagajna {currentRequest.register_id}</p>
              <p className="text-white/60 text-center text-xs mb-4">ZNESEK (EUR)</p>
              <p className="text-white text-5xl font-bold text-center tracking-tight">
                {formatPrice(currentRequest.amount)} €
              </p>
              {currentRequest.amount > PIN_THRESHOLD && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-amber-400 text-xs font-medium">Zahtevana PIN koda</p>
                </div>
              )}
            </div>

            {/* Simulated NFC / card insert area */}
            <button onClick={handleInsertCard}
              className="w-full bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border-2 border-dashed border-sky-400/40 hover:border-sky-400 rounded-xl p-6 mb-4 text-center transition-all">
              <Nfc className="w-10 h-10 text-sky-400 mx-auto mb-2" />
              <p className="text-sky-400 text-sm font-bold">PRISLONI / VSTAVI KARTICO</p>
            </button>

            <button onClick={handleDecline} disabled={processing}
              className="w-full h-14 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-bold text-base transition-colors disabled:opacity-50">
              PREKLIČI
            </button>
          </div>
        )}

        {/* ─── PIN ENTRY ─── */}
        {screen === 'pin-entry' && currentRequest && (
          <div className="w-full max-w-xs animate-fade-in">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-4 text-center">
              <p className="text-white/50 text-xs mb-1">NAKUP</p>
              <p className="text-white text-2xl font-bold">{formatPrice(currentRequest.amount)} €</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-white/50 text-xs text-center mb-3 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> VNESITE PIN KODO
              </p>
              <div className="flex justify-center gap-3 mb-1">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                    i < pinValue.length ? 'bg-sky-400 border-sky-400' : 'border-white/30'
                  }`} />
                ))}
              </div>
              {pinError && <p className="text-red-400 text-xs text-center mt-2">Vnesite 4-mestno PIN kodo</p>}
            </div>

            {/* Numpad */}
            <div className="space-y-2 mb-4">
              {numKeys.map((row, ri) => (
                <div key={ri} className="flex gap-2 justify-center">
                  {row.map(key => (
                    <button key={key} onClick={() => handlePinKey(key)}
                      className="w-16 h-14 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-2xl text-white transition-colors">
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex gap-2 justify-center">
                <button onClick={handleDecline}
                  className="w-16 h-14 bg-red-600/60 hover:bg-red-600 rounded-xl font-bold text-xs text-white transition-colors flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </button>
                <button onClick={() => handlePinKey('0')}
                  className="w-16 h-14 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-2xl text-white transition-colors">
                  0
                </button>
                <button onClick={handlePinDelete}
                  className="w-16 h-14 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-colors flex items-center justify-center">
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button onClick={handlePinConfirm}
              disabled={pinValue.length < 4}
              className="w-full h-14 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-30">
              POTRDI
            </button>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {screen === 'processing' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-sky-500/10 border-2 border-sky-400/30 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
            </div>
            <p className="text-white/60 text-lg font-medium">Obdelujem plačilo...</p>
            <p className="text-white/30 text-sm mt-2">Prosimo, počakajte</p>
          </div>
        )}

        {/* ─── APPROVED ─── */}
        {screen === 'approved' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <p className="text-green-400 text-2xl font-bold">ODOBRENO</p>
            <p className="text-white/40 text-sm mt-2">Plačilo uspešno</p>
            <p className="text-white/20 text-xs mt-1">Odstranite kartico</p>
          </div>
        )}

        {/* ─── DECLINED ─── */}
        {screen === 'declined' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-red-400 text-2xl font-bold">ZAVRNJENO</p>
            <p className="text-white/40 text-sm mt-2">Plačilo preklicano</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-white/20 py-3">
        StandBuy POS Terminal v1.0 • Blagajna {selectedRegister || '–'}
      </p>
    </div>
  );
};

export default POSTerminalApp;
