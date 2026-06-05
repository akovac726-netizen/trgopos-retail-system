import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RetroWindow, { RetroButton } from "./RetroWindow";

interface Order {
  id: string;
  date: string;
  supplier: string;
  status: string;
  items: any[];
  note: string;
  from_profile: string;
  to_profile: string;
}

const PrejetaNarocilaDialog = ({ onClose }: { onClose: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sel, setSel] = useState<number | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('to_profile', 'skladisce')
      .order('created_at', { ascending: false });
    setOrders((data || []) as Order[]);
  };

  useEffect(() => { refresh(); }, []);

  const odobri = async () => {
    if (sel === null) return;
    const o = orders[sel];
    // 1) mark order approved
    await supabase.from('orders').update({ status: 'Odobreno', received_confirmed: true }).eq('id', o.id);
    // 2) create dispatch (dobavnica)
    const delivery_no = `DOB-${Date.now().toString().slice(-6)}`;
    await supabase.from('dispatches').insert({
      related_order_id: o.id,
      items: o.items as any,
      status: 'pripravljeno',
      note: `Dobavnica št. ${delivery_no} | iz naročila ${o.note || ''}`,
    });
    toast.success(`Naročilo odobreno, ustvarjena dobavnica ${delivery_no}`);
    await refresh();
    setSel(null);
  };

  return (
    <RetroWindow title="Prejeta naročila (Skladišče)" onClose={onClose} width={720}>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-[#a8c0d8] text-white text-left">
                <th className="w-6" />
                <th className="px-2 py-1">Datum</th>
                <th className="px-2 py-1">Od</th>
                <th className="px-2 py-1">Opomba</th>
                <th className="px-2 py-1">Kos vrstic</th>
                <th className="px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr
                  key={o.id}
                  onClick={() => setSel(i)}
                  className="border-t cursor-pointer"
                  style={{ borderColor: '#e0e0e0', background: sel === i ? '#1f4a8a' : 'white', color: sel === i ? 'white' : '#111' }}
                >
                  <td className="text-center">{sel === i ? '▶' : ''}</td>
                  <td className="px-2 py-1">{o.date}</td>
                  <td className="px-2 py-1">{o.from_profile}</td>
                  <td className="px-2 py-1 truncate" style={{ maxWidth: 280 }}>{o.note}</td>
                  <td className="px-2 py-1">{(o.items || []).length}</td>
                  <td className="px-2 py-1 font-bold">{o.status}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-gray-500">Ni prejetih naročil.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <RetroButton onClick={odobri} disabled={sel === null}>Odobri in izdaj dobavnico</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default PrejetaNarocilaDialog;
