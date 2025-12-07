import { useState } from "react";
import { DoorOpen, X } from "lucide-react";
import { toast } from "sonner";

interface DrawerCodeDialogProps {
  drawerCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

const DrawerCodeDialog = ({ drawerCode, onSuccess, onClose }: DrawerCodeDialogProps) => {
  const [code, setCode] = useState("");

  const handleKeyPress = (key: string) => {
    if (code.length < 4) {
      setCode(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (code === drawerCode) {
      onSuccess();
      toast.success('Blagajniški predal odprt');
      onClose();
    } else {
      toast.error('Napačna koda');
      setCode("");
    }
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="pos-panel p-6 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <DoorOpen className="w-5 h-5" />
            Odpri predal
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code display */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Vnesite 4-mestno kodo
          </label>
          <div className="bg-muted rounded-lg p-4 text-center">
            <span className="font-mono text-3xl tracking-widest">
              {'●'.repeat(code.length) + '○'.repeat(4 - code.length)}
            </span>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {numpadKeys.map((key, index) => (
            <button
              key={index}
              onClick={() => key && handleKeyPress(key)}
              disabled={!key}
              className={`h-12 rounded-lg font-bold text-lg transition-colors ${
                key 
                  ? 'bg-muted hover:bg-muted/80 text-foreground' 
                  : 'invisible'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDelete}
            className="h-12 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
          >
            Briši
          </button>
          <button
            onClick={handleConfirm}
            disabled={code.length !== 4}
            className="h-12 pos-btn-confirm disabled:opacity-40"
          >
            Potrdi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawerCodeDialog;
