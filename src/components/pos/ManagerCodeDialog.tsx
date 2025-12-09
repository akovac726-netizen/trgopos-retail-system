import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ManagerCodeDialogProps {
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
}

const MANAGER_CODE = "58709";

const ManagerCodeDialog = ({ onSuccess, onClose, title = "Koda poslovodje" }: ManagerCodeDialogProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleKeyPress = (key: string) => {
    if (code.length < 5) {
      setCode(prev => prev + key);
      setError(false);
    }
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleConfirm = () => {
    if (code === MANAGER_CODE) {
      toast.success("Koda poslovodje potrjena");
      onSuccess();
      onClose();
    } else {
      setError(true);
      toast.error("Napačna koda poslovodje");
      setCode("");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className={`text-center text-3xl font-mono tracking-widest py-4 rounded-lg ${
            error ? 'bg-destructive/20 text-destructive' : 'bg-muted'
          }`}>
            {"•".repeat(code.length).padEnd(5, "_")}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((key, i) => (
              key ? (
                <button
                  key={i}
                  onClick={() => handleKeyPress(key)}
                  className="h-14 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {key}
                </button>
              ) : (
                <div key={i} />
              )
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDelete}
              className="h-12 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium transition-colors"
            >
              Briši
            </button>
            <button
              onClick={handleConfirm}
              disabled={code.length !== 5}
              className="h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50"
            >
              Potrdi
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerCodeDialog;
