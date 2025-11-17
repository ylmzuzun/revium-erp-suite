import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  order: any;
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export const EditOrderDialog = ({ open, onOpenChange, onSuccess, order }: EditOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    delivery_date: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    if (order && open) {
      setFormData({
        delivery_date: order.delivery_date || "",
        status: order.status || "pending",
        notes: order.notes || "",
      });
      fetchProducts();
      fetchOrderItems();
    }
  }, [order, open]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price")
        .order("name");
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Ürünler yüklenirken hata: " + error.message);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          products(name)
        `)
        .eq("order_id", order.id);
      
      if (error) throw error;
      
      const items = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      }));
      
      setOrderItems(items);
    } catch (error: any) {
      toast.error("Sipariş kalemleri yüklenirken hata: " + error.message);
    }
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", product_name: "", quantity: 1, unit_price: 0, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
        updated[index].unit_price = product.price || 0;
      }
    }
    
    const quantity = updated[index].quantity || 0;
    const unitPrice = updated[index].unit_price || 0;
    const discount = updated[index].discount || 0;
    updated[index].total = (quantity * unitPrice) - discount;
    
    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.20;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validItems = orderItems.filter(item => item.product_id && item.quantity > 0);
      
      if (validItems.length === 0) {
        toast.error("Lütfen en az bir ürün ekleyin");
        setLoading(false);
        return;
      }

      // Update order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          delivery_date: formData.delivery_date || null,
          status: formData.status as any,
          notes: formData.notes || null,
          subtotal,
          tax,
          total,
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      if (deleteError) throw deleteError;

      // Insert new items
      const itemsToInsert = validItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Sipariş güncellendi");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Siparişi Düzenle - {order?.order_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="in_progress">İşleniyor</SelectItem>
                  <SelectItem value="shipped">Kargoda</SelectItem>
                  <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Teslimat Tarihi</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ürünler</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orderItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Select 
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, "product_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ürün seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Miktar"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Birim Fiyat"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="İndirim"
                          value={item.discount}
                          onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-2">
                        <Input 
                          value={`₺${item.total.toFixed(2)}`}
                          disabled
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={orderItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ürün Ekle
            </Button>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span>₺{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>KDV (%20):</span>
                  <span>₺{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Genel Toplam:</span>
                  <span>₺{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
