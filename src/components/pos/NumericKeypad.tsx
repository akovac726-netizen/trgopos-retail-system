import { Delete, CornerDownLeft } from "lucide-react";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  showQuantityButtons?: boolean;
}

const NumericKeypad = ({ onKeyPress, onDelete, onConfirm, showQuantityButtons = true }: NumericKeypadProps) => {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <div className="flex flex-col gap-2">
      {showQuantityButtons && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {['1x', '2x', '5x', '10x'].map((qty) => (
            <button
              key={qty}
              onClick={() => onKeyPress(qty)}
              className="pos-btn-secondary h-12 text-lg"
            >
              {qty}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="pos-btn-numpad h-16 text-2xl"
          >
            {key}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={onDelete}
          className="pos-btn-action h-16 flex items-center justify-center gap-2"
        >
          <Delete className="w-6 h-6" />
          <span>Briši</span>
        </button>
        <button
          onClick={onConfirm}
          className="pos-btn-confirm h-16 flex items-center justify-center gap-2"
        >
          <CornerDownLeft className="w-6 h-6" />
          <span>Potrdi</span>
        </button>
      </div>
    </div>
  );
};

export default NumericKeypad;
