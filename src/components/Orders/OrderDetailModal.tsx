import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit, Trash2, Calendar, User, Building2, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const OrderDetailModal = ({ open, onOpenChange, order, onEdit, onDelete }: OrderDetailModalProps) => {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order?.id && open) {
      fetchOrderDetails();
    }
  }, [order, open]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      // Fetch order items with product details
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products(name, sku, unit)
        `)
        .eq("order_id", order.id);

      if (itemsError) throw itemsError;

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", order.customer_id)
        .single();

      if (customerError) throw customerError;

      setOrderItems(items || []);
      setCustomer(customerData);
    } catch (error: any) {
      toast.error("Detaylar yüklenirken hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered": return "default";
      case "in_progress": case "shipped": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Beklemede",
      confirmed: "Onaylandı",
      in_progress: "İşleniyor",
      shipped: "Kargoda",
      delivered: "Teslim Edildi",
      cancelled: "İptal",
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Sipariş Detayı - {order?.order_number}</DialogTitle>
            <Badge variant={getStatusVariant(order?.status)}>
              {getStatusLabel(order?.status)}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{customer?.name}</span>
                </div>
                {customer?.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.company}</span>
                  </div>
                )}
                {customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sipariş Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sipariş Tarihi</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(order.order_date).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                  {order.delivery_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Teslimat Tarihi</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(order.delivery_date).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                  )}
                </div>
                {order.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notlar</p>
                    <p className="mt-1">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.products?.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.products?.sku}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span>Miktar: {item.quantity}</span>
                            <span>Birim Fiyat: ₺{item.unit_price.toFixed(2)}</span>
                            {item.discount > 0 && (
                              <span className="text-destructive">İndirim: -₺{item.discount.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₺{item.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finansal Özet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ara Toplam:</span>
                    <span>₺{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KDV (%20):</span>
                    <span>₺{order.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Genel Toplam:</span>
                    <span>₺{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
