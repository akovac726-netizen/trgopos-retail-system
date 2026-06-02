import { useState } from "react";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";

const STEPS = [
  'Preveri konec ponudbe',
  'Prevzemi začetek ponudbe',
  'Izvleček prodajnih cen',
  'Natisni etikete',
  'Izvleček sprememb',
  'Širjenje blagajne',
  'Posodobitev blagajne',
];

const OtvoritevDialog = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const [date, setDate] = useState(`${dd}/${mm}/${yyyy}`);
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));

  const toggle = (i: number) => setDone(d => d.map((v, idx) => idx === i ? !v : v));
  const allDone = done.every(Boolean);

  return (
    <RetroWindow title="Otvoritev" onClose={onClose} width={560}>
      <div className="flex items-center gap-3 mb-3">
        <RetroLabel>Datum otvoritve:</RetroLabel>
        <RetroInput value={date} onChange={e => setDate(e.target.value)} style={{ width: 200 }} placeholder="DD/MM/LLLL" />
      </div>
      <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
        <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#e4e8ee] text-left">
              <th className="w-8" />
              <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Št.</th>
              <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Funkcija</th>
              <th className="px-2 py-1 w-24">Izvedeno</th>
            </tr>
          </thead>
          <tbody>
            {STEPS.map((s, i) => (
              <tr key={i} className="border-t" style={{ borderColor: '#e0e0e0' }}>
                <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">▶</td>
                <td className="px-2 py-1">{i + 1}.</td>
                <td className="px-2 py-1">{s}</td>
                <td className="px-2 py-1 text-center">
                  <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} />
                </td>
              </tr>
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                <td className="bg-[#e4e8ee]" /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div className="text-sm font-semibold italic" style={{ color: '#1a3a6a' }}>Postopek otvoritve …</div>
        <div className="flex gap-2">
          <RetroButton onClick={onClose}>Izhod</RetroButton>
          <RetroButton onClick={() => { if (allDone) onConfirm(); else alert('Označite vse korake.'); }}>Potrdi</RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
};

export default OtvoritevDialog;
