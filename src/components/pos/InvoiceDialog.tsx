import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Building2 } from "lucide-react";

export interface InvoiceData {
  companyName: string;
  taxNumber: string;
  address: string;
  city: string;
  postalCode: string;
}

interface InvoiceDialogProps {
  onConfirm: (data: InvoiceData) => void;
  onSkip: () => void;
  onClose: () => void;
}

const InvoiceDialog = ({ onConfirm, onSkip, onClose }: InvoiceDialogProps) => {
  const [data, setData] = useState<InvoiceData>({
    companyName: "",
    taxNumber: "",
    address: "",
    city: "",
    postalCode: ""
  });

  const handleSubmit = () => {
    if (data.companyName && data.taxNumber) {
      onConfirm(data);
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Faktura - podatki podjetja
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Naziv podjetja *</label>
            <Input
              value={data.companyName}
              onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Npr. Podjetje d.o.o."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Davčna številka *</label>
            <Input
              value={data.taxNumber}
              onChange={(e) => setData(prev => ({ ...prev, taxNumber: e.target.value }))}
              placeholder="SI12345678"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Naslov</label>
            <Input
              value={data.address}
              onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Ulica in hišna številka"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Poštna številka</label>
              <Input
                value={data.postalCode}
                onChange={(e) => setData(prev => ({ ...prev, postalCode: e.target.value }))}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kraj</label>
              <Input
                value={data.city}
                onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ljubljana"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                onSkip();
                onClose();
              }}
            >
              Preskoči (navaden račun)
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmit}
              disabled={!data.companyName || !data.taxNumber}
            >
              <FileText className="w-4 h-4 mr-2" />
              Izdaj fakturo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
