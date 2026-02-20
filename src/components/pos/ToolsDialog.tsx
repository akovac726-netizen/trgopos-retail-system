import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wrench, Calculator, DoorOpen } from "lucide-react";

interface ToolsDialogProps {
  hasItems: boolean;
  onClosingClick: () => void;
  onOpenDrawer: () => void;
  onClose: () => void;
}

const ToolsDialog = ({ hasItems, onClosingClick, onOpenDrawer, onClose }: ToolsDialogProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Orodja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <button
            onClick={() => { onClose(); onClosingClick(); }}
            disabled={hasItems}
            className="w-full h-14 flex items-center gap-3 px-4 rounded-lg font-medium transition-colors bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Calculator className="w-5 h-5" />
            <div className="text-left">
              <span className="block">Blagajniški zaključek</span>
              {hasItems && (
                <span className="text-xs text-muted-foreground">Zaključite ali stornirajte odprt račun</span>
              )}
            </div>
          </button>

          <button
            onClick={() => { onClose(); onOpenDrawer(); }}
            className="w-full h-14 flex items-center gap-3 px-4 rounded-lg font-medium transition-colors bg-amber-500/10 hover:bg-amber-500/20 text-amber-600"
          >
            <DoorOpen className="w-5 h-5" />
            <span>Odpri blagajniški predal</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolsDialog;
