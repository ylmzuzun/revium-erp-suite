import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Package, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hızlı İşlemler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => navigate("/tasks")}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Yeni Görev</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => navigate("/production")}
          >
            <Package className="h-5 w-5" />
            <span className="text-sm">Yeni Sipariş</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => navigate("/customers")}
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">Yeni Müşteri</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => navigate("/orders")}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-sm">Yeni Sipariş</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
