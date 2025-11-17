import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";

const Customers = () => {
  const customers = [
    { id: 1, name: "Ahmet Yılmaz", email: "ahmet@example.com", phone: "0532 111 22 33", company: "ABC Ltd." },
    { id: 2, name: "Ayşe Demir", email: "ayse@example.com", phone: "0533 222 33 44", company: "XYZ A.Ş." },
    { id: 3, name: "Mehmet Kaya", email: "mehmet@example.com", phone: "0534 333 44 55", company: "DEF Ltd." },
    { id: 4, name: "Fatma Şahin", email: "fatma@example.com", phone: "0535 444 55 66", company: "GHI A.Ş." },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Müşteriler</h1>
            <p className="text-muted-foreground mt-1">Müşteri bilgilerini yönetin</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Müşteri ara..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Detaylar</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Customers;
