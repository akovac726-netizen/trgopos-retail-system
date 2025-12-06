interface InputDisplayProps {
  value: string;
  label: string;
}

const InputDisplay = ({ value, label }: InputDisplayProps) => {
  return (
    <div className="pos-panel p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
        <span className="font-mono text-2xl font-bold">
          {value || '0'}
        </span>
        <span className="text-muted-foreground">PLU / Količina</span>
      </div>
    </div>
  );
};

export default InputDisplay;
