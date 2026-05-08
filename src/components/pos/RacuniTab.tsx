import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import DrawerCodeDialog from "./DrawerCodeDialog";

interface RacuniTabProps {
  cashier: Cashier;
  registerId: number;
}

interface Receipt {
  id: string;
  receipt_number: string;
  created_at: string;
  cashier_name: string;
  total: number;
  voided: boolean;
  invoice_data: any;
  items: any;
  payment_method: string;
  void_reason: string | null;
}

const RacuniTab = ({ cashier, registerId }: RacuniTabProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [forDate, setForDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchNumber, setSearchNumber] = useState<string>("");
  const [keypadTarget, setKeypadTarget] = useState<'date' | 'number'>('number');
  const [showStornoDialog, setShowStornoDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<'invoice' | 'copy' | null>(null);

  const fetchForDate = async (dateStr: string) => {
    const start = `${dateStr}T00:00:00.000Z`;
    const end = `${dateStr}T23:59:59.999Z`;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });
    if (data) setReceipts(data as Receipt[]);
  };

  useEffect(() => { fetchForDate(forDate); }, [forDate]);

  const handleKeypad = (key: string) => {
    if (keypadTarget === 'number') {
      if (key === 'del') setSearchNumber(s => s.slice(0, -1));
      else if (key === '.') return;
      else setSearchNumber(s => s + key);
    } else {
      // date typing - just allow digits to compose YYYY-MM-DD via day picker
      if (key === 'del') setForDate(d => d.slice(0, -1));
    }
  };

  const handleConfirm = async () => {
    if (searchNumber) {
      const found = receipts.find(r => r.receipt_number.includes(searchNumber));
      if (found) { setSelected(found); toast.success(`Račun ${found.receipt_number} najden`); }
      else toast.error('Račun ni najden v dnevni evidenci');
    } else {
      fetchForDate(forDate);
    }
  };

  const handleStorno = async () => {
    if (!selected) { toast.error('Najprej izberite račun'); return; }
    if (selected.voided) { toast.warning('Račun je že storniran'); return; }
    setShowStornoDialog(true);
  };

  const performStorno = async () => {
    if (!selected) return;
    const { error } = await supabase.from('transactions')
      .update({ voided: true, void_reason: `Storno računa - ${cashier.name}` })
      .eq('id', selected.id);
    if (error) { toast.error('Napaka pri storno'); return; }
    toast.success(`Račun ${selected.receipt_number} storniran (NE kot lastna raba)`);
    setShowStornoDialog(false);
    fetchForDate(forDate);
    setSelected(null);
  };

  const handlePrint = () => {
    if (!selected) { toast.error('Izberite račun'); return; }
    setPreviewMode('copy');
  };

  const handleInvoice = () => {
    if (!selected) { toast.error('Izberite račun'); return; }
    setPreviewMode('invoice');
  };

  const handleCopyToNew = () => {
    if (!selected) { toast.error('Izberite račun'); return; }
    toast.success('Vsebina računa kopirana - odprite Blagajno');
  };

  if (showStornoDialog) {
    return <DrawerCodeDialog
      drawerCode={cashier.drawerCode}
      onSuccess={performStorno}
      onClose={() => setShowStornoDialog(false)}
    />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e8f4f8' }}>
      <div className="border-2 border-gray-800 bg-white mx-3 mt-3 flex-1 flex flex-col overflow-hidden" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
        <div className="px-4 py-2 font-bold text-lg border-b border-gray-400">Glavni meni:</div>
        {/* Sub-tabs */}
        <div className="flex border-b border-gray-400">
          <div className="px-6 py-2 font-bold text-base bg-sky-200 border-r border-gray-400">Računi</div>
          <div className="px-6 py-2 font-bold text-base bg-white border-r border-gray-400 text-gray-400">Zaključek</div>
          <div className="flex-1" />
          <div className="px-6 py-2 font-bold text-base bg-white border-l border-gray-400 text-gray-400">Nastavitve</div>
          <div className="px-6 py-2 font-bold text-base bg-white border-l border-gray-400 text-gray-400">Informacije</div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Daily receipts */}
          <div className="flex-1 flex flex-col border-r border-gray-400 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-300">
              <div className="font-bold text-lg">Računi:</div>
              <div className="text-xs text-gray-600 italic">Dnevna evidenca izdanih blagajniških računov</div>
            </div>
            <div className="grid grid-cols-5 gap-1 px-3 py-1.5 bg-white text-xs font-bold border-b border-gray-400">
              <div>Št. računa</div><div>Datum in ura</div><div>Blagajnik</div><div className="text-right">Znesek računa</div><div className="text-center">FuRS potr.</div>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {receipts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Ni računov za izbrani dan</div>
              ) : receipts.map((r) => (
                <div key={r.id} onClick={() => setSelected(r)}
                  className={`grid grid-cols-5 gap-1 px-3 py-1.5 text-xs border-b border-gray-200 cursor-pointer hover:bg-sky-50 ${
                    selected?.id === r.id ? 'bg-sky-200' : r.voided ? 'bg-red-50 line-through text-red-700' : ''
                  }`}>
                  <div className="font-mono font-bold">{r.receipt_number}</div>
                  <div>{new Date(r.created_at).toLocaleString('sl-SI', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="truncate">{r.cashier_name}</div>
                  <div className="text-right font-bold">{Number(r.total).toFixed(2)} €</div>
                  <div className="text-center">{r.invoice_data?.furs_eor ? '✓' : '–'}</div>
                </div>
              ))}
            </div>
            {/* Action buttons - Diapozitiv image.png bottom row */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white border-t border-gray-400">
              <button onClick={() => selected && toast.info(`Pregled: ${selected.receipt_number}`)}
                className="px-2 py-2 bg-white border-2 border-gray-500 rounded text-sm hover:bg-gray-100">Pregled računa</button>
              <button onClick={handlePrint} className="px-2 py-2 bg-white border-2 border-gray-500 rounded text-sm hover:bg-gray-100">Tiskaj račun</button>
              <button onClick={() => fetchForDate(forDate)} className="px-2 py-2 bg-white border-2 border-gray-500 rounded text-sm hover:bg-gray-100">Najdi račun</button>
              <button onClick={handleInvoice} className="px-2 py-2 bg-white border-2 border-gray-500 rounded text-sm hover:bg-gray-100">Izpiši fakturo</button>
              <button onClick={handleCopyToNew} className="px-2 py-2 bg-white border-2 border-gray-500 rounded text-sm hover:bg-gray-100">Kopiraj v nov</button>
              <button onClick={handleStorno} className="px-2 py-2 bg-red-600 text-white border-2 border-red-700 rounded text-sm font-bold hover:bg-red-700">Storniraj račun</button>
            </div>
          </div>

          {/* RIGHT: Search panel */}
          <div className="w-[320px] flex flex-col bg-white">
            <div className="text-center font-bold text-lg py-3 border-b border-gray-400">Iskanje računa</div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="font-bold text-sm w-20">Za dan:</label>
                <input type="date" value={forDate} onChange={e => setForDate(e.target.value)}
                  onFocus={() => setKeypadTarget('date')}
                  className="flex-1 h-9 px-2 border-2 border-gray-400 bg-sky-50 text-sm font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-bold text-sm w-20">Račun št.:</label>
                <input type="text" value={searchNumber} onChange={e => setSearchNumber(e.target.value)}
                  onFocus={() => setKeypadTarget('number')}
                  className="flex-1 h-9 px-2 border-2 border-gray-400 bg-sky-50 text-sm font-mono" />
              </div>
            </div>
            {/* Confirm/cancel */}
            <div className="grid grid-cols-2 gap-2 px-4">
              <button onClick={handleConfirm}
                className="h-12 bg-green-400 hover:bg-green-500 border-2 border-green-600 rounded font-bold text-base text-white">Potrdi</button>
              <button onClick={() => { setSearchNumber(''); setSelected(null); }}
                className="h-12 bg-red-500 hover:bg-red-600 border-2 border-red-700 rounded font-bold text-base text-white">Prekliči</button>
            </div>
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 p-4 mt-2">
              {['7','8','9','4','5','6','1','2','3','0','.','del'].map(k => (
                <button key={k} onClick={() => handleKeypad(k)}
                  className={`h-12 rounded border-2 font-bold text-lg ${
                    k === 'del' ? 'bg-red-500 text-white border-red-700 hover:bg-red-600'
                              : 'bg-sky-200 text-gray-800 border-sky-400 hover:bg-sky-300'
                  }`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewMode && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewMode(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto" style={{ fontFamily: 'Courier New, monospace' }}>
            <div className="text-center mb-4">
              <div className="font-bold text-lg">{previewMode === 'invoice' ? 'FAKTURA' : 'KOPIJA RAČUNA'}</div>
              <div className="text-xs">StandBuy CMP s.p.</div>
              <div className="text-xs">Spodnja Draga 36, 1295 Ivančna Gorica</div>
            </div>
            <div className="border-y py-2 my-2 text-sm">
              <div>Št. računa: <strong>{selected.receipt_number}</strong></div>
              <div>Datum: {new Date(selected.created_at).toLocaleString('sl-SI')}</div>
              <div>Blagajnik: {selected.cashier_name}</div>
              <div>Blagajna: {registerId}</div>
            </div>
            <div className="text-sm">
              {(selected.items || []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.quantity}× {it.name}</span>
                  <span>{(Number(it.price) * it.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>SKUPAJ:</span><span>{Number(selected.total).toFixed(2)} €</span>
            </div>
            <div className="text-center text-xs mt-3">Način plačila: {selected.payment_method}</div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { window.print(); }} className="flex-1 px-4 py-2 bg-sky-500 text-white rounded font-bold">Natisni</button>
              <button onClick={() => setPreviewMode(null)} className="flex-1 px-4 py-2 bg-gray-200 rounded font-bold">Zapri</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RacuniTab;
