import RetroWindow, { RetroButton } from "./RetroWindow";

interface Props {
  title?: string;
  message?: string;
  yesLabel?: string;
  noLabel?: string;
  onYes: () => void;
  onNo: () => void;
  zIndex?: number;
}

const ConfirmDialog = ({
  title = "Otvoritev",
  message = "Ali ste prepričani, da želite nadaljevati?",
  yesLabel = "SI",
  noLabel = "NEIN",
  onYes,
  onNo,
  zIndex = 80,
}: Props) => (
  <RetroWindow title={title} onClose={onNo} width={380} zIndex={zIndex}>
    <div className="py-6 text-center text-sm font-bold" style={{ color: '#1a1a1a' }}>
      {message}
    </div>
    <div className="flex justify-center gap-6 pb-2">
      <RetroButton onClick={onYes} className="!min-w-[80px] font-bold">{yesLabel}</RetroButton>
      <RetroButton onClick={onNo} className="!min-w-[80px] font-bold">{noLabel}</RetroButton>
    </div>
  </RetroWindow>
);

export default ConfirmDialog;
