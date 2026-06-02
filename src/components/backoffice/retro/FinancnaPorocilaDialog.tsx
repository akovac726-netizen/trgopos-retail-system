import { useState } from "react";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";

interface Report { date: string; type: string; }

const FinancnaPorocilaDialog = ({ onClose }: { onClose: () => void }) => {
  const [filter, setFilter] = useState('');
  const [showDaily, setShowDaily] = useState(false);
  const [reports] = useState<Report[]>([
    { date: '13/05/2026', type: 'Dnevni promet blagajne' },
  ]);

  return (
    <>
      <RetroWindow title="Finančna poročila" onClose={onClose} width={620}>
        <div className="flex items-center gap-3 mb-3">
          <RetroLabel>Iskanje poročila:</RetroLabel>
          <RetroInput value={filter} onChange={e => setFilter(e.target.value)} placeholder="Vnesite datum" style={{ width: 260 }} />
        </div>
        <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
          <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#e4e8ee] text-left">
                <th className="w-8" />
                <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Datum</th>
                <th className="px-2 py-1">Vrsta poročila</th>
              </tr>
            </thead>
            <tbody>
              {reports.filter(r => !filter || r.date.includes(filter)).map((r, i) => (
                <tr key={i} className="border-t cursor-pointer hover:bg-blue-50" style={{ borderColor: '#e0e0e0' }} onClick={() => setShowDaily(true)}>
                  <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">▶</td>
                  <td className="px-2 py-1">{r.date}</td>
                  <td className="px-2 py-1">{r.type}</td>
                </tr>
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                  <td className="bg-[#e4e8ee]" /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </RetroWindow>

      {showDaily && <DnevnoPorociloBlagajneDialog onClose={() => setShowDaily(false)} />}
    </>
  );
};

export const DnevnoPorociloBlagajneDialog = ({ onClose }: { onClose: () => void }) => {
  const blagajne = [1, 2, 3, 4];
  return (
    <RetroWindow title="Dnevno poročilo blagajne" onClose={onClose} width={520} zIndex={60} offsetX={50} offsetY={40}>
      <div className="space-y-4">
        {blagajne.map(n => (
          <div key={n} className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 items-center">
            <div className="font-semibold text-sm" style={{ color: '#1a3a6a' }}>Blagajna {n}</div>
            <div className="grid grid-cols-[90px_1fr] gap-2 items-center">
              <span className="text-sm">Gotovina:</span>
              <RetroInput defaultValue="" />
              <span className="text-sm">Kartica:</span>
              <RetroInput defaultValue="" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <RetroButton onClick={() => window.print()}>Tiskaj</RetroButton>
        <RetroButton onClick={onClose}>Potrdi</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default FinancnaPorocilaDialog;
