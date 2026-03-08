import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle2, XCircle, Wifi, WifiOff, ArrowLeft } from "lucide-react";

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

const POSTerminalApp = ({ onBack }: POSTerminalAppProps) => {
  const [connected, setConnected] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TerminalRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<'approved' | 'declined' | null>(null);

  const formatPrice = (price: number) =>
    price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Listen for pending terminal requests
  useEffect(() => {
    setConnected(true);

    // Fetch any existing pending request
    const fetchPending = async () => {
      const { data } = await supabase
        .from('terminal_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setCurrentRequest(data[0] as TerminalRequest);
        setLastAction(null);
      }
    };
    fetchPending();

    const channel = supabase
      .channel('terminal-listen')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'terminal_requests',
      }, (payload) => {
        const req = payload.new as TerminalRequest;
        if (req.status === 'pending') {
          setCurrentRequest(req);
          setLastAction(null);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'terminal_requests',
      }, (payload) => {
        const req = payload.new as TerminalRequest;
        // If it was cancelled from POS side
        if (req.status === 'cancelled' && currentRequest?.id === req.id) {
          setCurrentRequest(null);
          setLastAction(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleApprove = async () => {
    if (!currentRequest) return;
    setProcessing(true);
    await supabase
      .from('terminal_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('id', currentRequest.id);
    setProcessing(false);
    setLastAction('approved');
    setCurrentRequest(null);
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleDecline = async () => {
    if (!currentRequest) return;
    setProcessing(true);
    await supabase
      .from('terminal_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', currentRequest.id);
    setProcessing(false);
    setLastAction('declined');
    setCurrentRequest(null);
    setTimeout(() => setLastAction(null), 3000);
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Nazaj
        </button>
        <div className="flex items-center gap-2">
          {connected ? (
            <><Wifi className="w-4 h-4 text-green-400" /><span className="text-green-400 text-xs font-medium">Povezan</span></>
          ) : (
            <><WifiOff className="w-4 h-4 text-red-400" /><span className="text-red-400 text-xs font-medium">Ni povezave</span></>
          )}
        </div>
      </div>

      {/* Logo area */}
      <div className="text-center pt-6 pb-4">
        <h1 className="text-2xl font-black tracking-wide">
          <span className="text-sky-400">Stand</span><span className="text-sky-300">Buy</span>
          <span className="text-orange-400 text-xl ml-1">★</span>
        </h1>
        <p className="text-white/50 text-xs font-medium tracking-[0.3em] mt-1">POS TERMINAL</p>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* No active request - idle */}
        {!currentRequest && !lastAction && (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
              <CreditCard className="w-12 h-12 text-sky-400/50" />
            </div>
            <p className="text-white/40 text-lg font-medium">Čakam na plačilo...</p>
            <p className="text-white/20 text-sm mt-2">Terminal je pripravljen za uporabo</p>
          </div>
        )}

        {/* Last action feedback */}
        {!currentRequest && lastAction === 'approved' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <p className="text-green-400 text-xl font-bold">ODOBRENO</p>
            <p className="text-white/40 text-sm mt-2">Plačilo uspešno izvedeno</p>
          </div>
        )}
        {!currentRequest && lastAction === 'declined' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-red-400 text-xl font-bold">ZAVRNJENO</p>
            <p className="text-white/40 text-sm mt-2">Plačilo je bilo preklicano</p>
          </div>
        )}

        {/* Active payment request */}
        {currentRequest && (
          <div className="w-full max-w-sm animate-fade-in">
            {/* Amount display */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6">
              <p className="text-white/50 text-sm text-center mb-1">NAKUP – Blagajna {currentRequest.register_id}</p>
              <p className="text-white/60 text-center text-xs mb-4">ZNESEK (EUR)</p>
              <p className="text-white text-5xl font-bold text-center tracking-tight">
                {formatPrice(currentRequest.amount)} €
              </p>
            </div>

            {/* Simulated card insertion area */}
            <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-4 mb-6 text-center">
              <CreditCard className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <p className="text-white/40 text-xs">Vstavi / prisloni kartico</p>
            </div>

            {/* Approve / Decline */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                disabled={processing}
                className="flex-1 h-16 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
              >
                PREKLIČI
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 h-16 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
              >
                POTRDI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-white/20 py-3">
        StandBuy POS Terminal v1.0
      </p>
    </div>
  );
};

export default POSTerminalApp;
