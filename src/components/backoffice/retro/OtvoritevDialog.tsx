import { useState } from "react";
import jsPDF from "jspdf";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import ConfirmDialog from "./ConfirmDialog";

interface Step {
  label: string;
  /** generates a small "previous action" report PDF when the step is confirmed */
  report: (date: string) => void;
}

const buildPdf = (title: string, lines: string[]) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  lines.forEach((l, i) => doc.text(l, 14, 30 + i * 7));
  window.open(doc.output('bloburl') as unknown as string, '_blank');
};

const STEPS: Step[] = [
  {
    label: 'Preveri konec ponudbe',
    report: (d) => buildPdf('Poročilo: konec prejšnje ponudbe', [`Datum: ${d}`, 'Status: zaključeno', 'Vse pretekle akcije pravilno zaprte.']),
  },
  {
    label: 'Prevzemi začetek ponudbe',
    report: (d) => buildPdf('Poročilo: začetek nove ponudbe', [`Datum: ${d}`, 'Nove cene aktivne.', 'Etikete pripravljene za tisk.']),
  },
  {
    label: 'Izvleček prodajnih cen',
    report: (d) => buildPdf('Izvleček prodajnih cen', [`Datum: ${d}`, 'Cene posodobljene v sistemu.', 'Razlike s preteklim obdobjem: 0.']),
  },
  {
    label: 'Natisni etikete',
    report: (d) => buildPdf('Tisk etiket', [`Datum: ${d}`, 'Število etiket: 0', 'Tiskanje sproženo.']),
  },
  {
    label: 'Izvleček sprememb',
    report: (d) => buildPdf('Izvleček sprememb cen', [`Datum: ${d}`, 'Spremembe: 0', 'Status: brez napak.']),
  },
  {
    label: 'Širjenje blagajne',
    report: (d) => buildPdf('Širjenje cen na blagajne', [`Datum: ${d}`, 'Blagajne: 1,2,3', 'Status: posodobljeno.']),
  },
  {
    label: 'Posodobitev blagajne',
    report: (d) => buildPdf('Posodobitev blagajne', [`Datum: ${d}`, 'Restart simuliran.', 'Status: OK.']),
  },
];

const OtvoritevDialog = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const [date, setDate] = useState(`${dd}/${mm}/${yyyy}`);
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [confirmFinal, setConfirmFinal] = useState(false);

  const handleConfirmStep = () => {
    if (confirmIdx === null) return;
    const i = confirmIdx;
    STEPS[i].report(date);
    setDone(d => d.map((v, idx) => idx === i ? true : v));
    setConfirmIdx(null);
  };

  const allDone = done.every(Boolean);

  return (
    <>
      <RetroWindow title="Otvoritev" onClose={onClose} width={580}>
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
                <th className="px-2 py-1 w-24 text-center">Izvedeno</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((s, i) => (
                <tr
                  key={i}
                  onClick={() => setConfirmIdx(i)}
                  className="border-t cursor-pointer hover:bg-blue-50"
                  style={{ borderColor: '#e0e0e0' }}
                >
                  <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">▶</td>
                  <td className="px-2 py-1">{i + 1}.</td>
                  <td className="px-2 py-1 underline" style={{ color: '#0a4ba0' }}>{s.label}</td>
                  <td className="px-2 py-1 text-center">
                    <span style={{ color: done[i] ? '#0a8a1a' : '#a00' }}>{done[i] ? '✔' : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-end justify-between mt-4">
          <div className="text-sm font-semibold italic" style={{ color: '#1a3a6a' }}>
            {allDone ? 'Vsi koraki izvedeni — lahko potrdite.' : 'Kliknite na funkcijo za izvedbo …'}
          </div>
          <div className="flex gap-2">
            <RetroButton onClick={onClose}>Izhod</RetroButton>
            <RetroButton onClick={() => setConfirmFinal(true)} disabled={!allDone}>Potrdi</RetroButton>
          </div>
        </div>
      </RetroWindow>

      {confirmIdx !== null && (
        <ConfirmDialog
          title="Otvoritev"
          message="Ali ste prepričani, da želite nadaljevati?"
          onYes={handleConfirmStep}
          onNo={() => setConfirmIdx(null)}
        />
      )}
      {confirmFinal && (
        <ConfirmDialog
          title="Otvoritev"
          message="Ali ste prepričani, da želite nadaljevati?"
          onYes={() => { setConfirmFinal(false); onConfirm(); }}
          onNo={() => setConfirmFinal(false)}
        />
      )}
    </>
  );
};

export default OtvoritevDialog;
