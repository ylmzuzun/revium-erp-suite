import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { CreateCustomerDialog } from "@/components/Customers/CreateCustomerDialog";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateOrderDialog = ({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [formData, setFormData] = useState({
    order_number: `SIP-${Date.now()}`,
    product_name: "",
    quantity: "",
    unit: "Adet",
    customer_id: "",
    due_date: "",
    priority: "0",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company")
        .order("name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error("Müşteriler yüklenirken hata: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCustomer = customers.find(c => c.id === formData.customer_id);
      
      const { error } = await supabase.from("production_orders").insert({
        order_number: formData.order_number,
        product_name: formData.product_name,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        customer_id: formData.customer_id || null,
        customer_name: selectedCustomer?.name || null,
        due_date: formData.due_date,
        priority: parseInt(formData.priority),
        notes: formData.notes || null,
        created_by: user?.id || "",
        status: "planned",
      });

      if (error) throw error;

      toast.success("Sipariş başarıyla oluşturuldu");
      onSuccess();
      onOpenChange(false);
      setFormData({
        order_number: `SIP-${Date.now()}`,
        product_name: "",
        quantity: "",
        unit: "Adet",
        customer_id: "",
        due_date: "",
        priority: "0",
        notes: "",
      });
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSuccess = async () => {
    await fetchCustomers();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Üretim Siparişi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_number">Sipariş No</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">Müşteri</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(value) => {
                  if (value === "new_customer") {
                    setShowAddCustomerDialog(true);
                  } else {
                    setFormData({ ...formData, customer_id: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_customer">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Yeni Müşteri Ekle</span>
                    </div>
                  </SelectItem>
                  <SelectSeparator />
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.company ? `- ${customer.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Ürün Adı</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Miktar</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Birim</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adet">Adet</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Lt">Lt</SelectItem>
                  <SelectItem value="Mt">Mt</SelectItem>
                  <SelectItem value="M2">M²</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Termin Tarihi</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik (0-5)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="5"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>
          </div>

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
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CreateCustomerDialog 
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
        onSuccess={handleCustomerSuccess}
      />
    </Dialog>
  );
};
