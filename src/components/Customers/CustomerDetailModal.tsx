import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Building2, MapPin, FileText } from "lucide-react";

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export const CustomerDetailModal = ({ open, onOpenChange, customer }: CustomerDetailModalProps) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Müşteri Detayları</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold">{customer.name}</h3>
            {customer.company && (
              <p className="text-muted-foreground">{customer.company}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">E-posta</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {customer.tax_number && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vergi No</p>
                    <p className="text-sm text-muted-foreground">{customer.tax_number}</p>
                  </div>
                </div>
              )}

              {customer.company && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Şirket</p>
                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {customer.address && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-2">Adres</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {customer.address}
                  </p>
                </div>
              </div>
            </>
          )}

          {customer.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Notlar</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p>Oluşturma Tarihi</p>
              <p className="font-medium">
                {new Date(customer.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div>
              <p>Son Güncelleme</p>
              <p className="font-medium">
                {new Date(customer.updated_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
