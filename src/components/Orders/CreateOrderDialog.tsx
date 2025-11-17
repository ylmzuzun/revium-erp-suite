import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerCombobox } from "@/components/Customers/CustomerCombobox";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export const CreateOrderDialog = ({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  
  const [orderData, setOrderData] = useState({
    customer_id: "",
    customer_name: "",
    delivery_date: "",
    notes: "",
    order_number: `SIP-${Date.now()}`,
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { product_id: "", product_name: "", quantity: 1, unit_price: 0, discount: 0, total: 0 }
  ]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

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
    
    // Calculate total
    const quantity = updated[index].quantity || 0;
    const unitPrice = updated[index].unit_price || 0;
    const discount = updated[index].discount || 0;
    updated[index].total = (quantity * unitPrice) - discount;
    
    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.20;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!orderData.customer_id) {
      toast.error("Lütfen müşteri seçin");
      return;
    }

    const validItems = orderItems.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Lütfen en az bir ürün ekleyin");
      return;
    }

    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderData.order_number,
          customer_id: orderData.customer_id,
          delivery_date: orderData.delivery_date || null,
          notes: orderData.notes || null,
          subtotal,
          tax,
          total,
          created_by: user?.id || "",
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
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

      toast.success("Sipariş başarıyla oluşturuldu");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setStep(1);
      setOrderData({
        customer_id: "",
        customer_name: "",
        delivery_date: "",
        notes: "",
        order_number: `SIP-${Date.now()}`,
      });
      setOrderItems([{ product_id: "", product_name: "", quantity: 1, unit_price: 0, discount: 0, total: 0 }]);
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Sipariş Oluştur</DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Müşteri</span>
            </div>
            <div className={`flex items-center gap-2 ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Ürünler</span>
            </div>
            <div className={`flex items-center gap-2 ${step === 3 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                3
              </div>
              <span className="text-sm font-medium">Özet</span>
            </div>
          </div>

          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order_number">Sipariş No</Label>
                <Input
                  id="order_number"
                  value={orderData.order_number}
                  onChange={(e) => setOrderData({ ...orderData, order_number: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer_id">Müşteri *</Label>
                <CustomerCombobox
                  value={orderData.customer_id}
                  onChange={(customerId, customerName) => 
                    setOrderData({ ...orderData, customer_id: customerId, customer_name: customerName })
                  }
                  placeholder="Müşteri seçin veya ara..."
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!orderData.customer_id}
                >
                  İleri <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Label>Ürün</Label>
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
                                  {product.name} - {product.sku}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Miktar</Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label>Birim Fiyat</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label>İndirim</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="col-span-2 flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Toplam</Label>
                            <Input 
                              value={`₺${item.total.toFixed(2)}`}
                              disabled
                            />
                          </div>
                          <Button 
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

              <Button variant="outline" onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Ürün Ekle
              </Button>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <Button onClick={() => setStep(3)}>
                  İleri <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Müşteri</Label>
                      <p className="font-medium">{orderData.customer_name || "-"}</p>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Toplam Ürün</Label>
                      <p className="font-medium">{orderItems.filter(i => i.product_id).length} ürün</p>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span>Ara Toplam:</span>
                        <span>₺{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>KDV (%20):</span>
                        <span>₺{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Genel Toplam:</span>
                        <span>₺{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="delivery_date">Teslimat Tarihi</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={orderData.delivery_date}
                  onChange={(e) => setOrderData({ ...orderData, delivery_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Oluşturuluyor..." : "Siparişi Oluştur"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
