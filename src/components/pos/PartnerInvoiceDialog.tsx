import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Search, CreditCard, Banknote, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceData } from "@/types/pos";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  tax_number: string;
  address: string;
  city: string;
  postal_code: string;
}

interface PartnerInvoiceDialogProps {
  onConfirm: (invoiceData: InvoiceData, paymentMethod: string) => void;
  onClose: () => void;
}

const PartnerInvoiceDialog = ({ onConfirm, onClose }: PartnerInvoiceDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase.from('partners').select('*').order('name');
      if (!error && data) setPartners(data as Partner[]);
      setLoading(false);
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners.slice(0, 20));
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredPartners(
        partners.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.tax_number.includes(searchQuery)
        )
      );
    }
  }, [searchQuery, partners]);

  const handleConfirm = () => {
    if (!selectedPartner) {
      toast.error('Izberite podjetje');
      return;
    }
    const invoiceData: InvoiceData = {
      companyName: selectedPartner.name,
      taxNumber: selectedPartner.tax_number,
      address: selectedPartner.address,
      city: selectedPartner.city,
      postalCode: selectedPartner.postal_code,
    };
    onConfirm(invoiceData, paymentMethod);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Plačilo na fakturo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Iščite po imenu ali davčni številki..."
              className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Partners list */}
          <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Nalagam partnerje...</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Ni najdenih partnerjev.</p>
                <p className="text-xs mt-1">Dodajte partnerje v BackOffice → Partnerji</p>
              </div>
            ) : (
              filteredPartners.map(partner => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                    selectedPartner?.id === partner.id
                      ? 'bg-primary/10 border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        DDV: {partner.tax_number} • {partner.city}
                      </p>
                    </div>
                    {selectedPartner?.id === partner.id && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected partner info */}
          {selectedPartner && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-foreground">{selectedPartner.name}</p>
              <p className="text-sm text-muted-foreground">Davčna: {selectedPartner.tax_number}</p>
              <p className="text-sm text-muted-foreground">{selectedPartner.address}, {selectedPartner.postal_code} {selectedPartner.city}</p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Način plačila fakture:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                <Banknote className="w-5 h-5" />
                Gotovina
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`h-12 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Kartica
              </button>
            </div>
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={!selectedPartner}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Check className="w-5 h-5" />
            Potrdi fakturo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerInvoiceDialog;
