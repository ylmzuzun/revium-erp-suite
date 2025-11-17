import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, User, Clock } from "lucide-react";

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export const OrderDetailModal = ({ open, onOpenChange, order }: OrderDetailModalProps) => {
  if (!order) return null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: "Planlanan",
      in_production: "Üretimde",
      quality_check: "Kalite Kontrol",
      completed: "Tamamlandı",
      on_hold: "Beklemede",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_production":
        return "secondary";
      case "planned":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sipariş Detayları</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{order.order_number}</h3>
              <p className="text-muted-foreground">{order.product_name}</p>
            </div>
            <Badge variant={getStatusVariant(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Müşteri</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name || "Belirtilmemiş"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Miktar</p>
                  <p className="text-sm text-muted-foreground">
                    {order.quantity} {order.unit}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Termin Tarihi</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.due_date).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Öncelik</p>
                  <p className="text-sm text-muted-foreground">
                    {order.priority || 0} / 5
                  </p>
                </div>
              </div>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Notlar</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p>Oluşturma Tarihi</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div>
              <p>Son Güncelleme</p>
              <p className="font-medium">
                {new Date(order.updated_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
