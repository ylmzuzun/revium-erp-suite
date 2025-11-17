import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MaterialTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialName: string;
}

export const MaterialTransactionsDialog = ({
  open,
  onOpenChange,
  materialId,
  materialName,
}: MaterialTransactionsDialogProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open, materialId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("material_transactions")
        .select(`
          *,
          profiles(full_name)
        `)
        .eq("raw_material_id", materialId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("İşlemler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Satın Alma",
      consumption: "Tüketim",
      adjustment: "Düzeltme",
      return: "İade",
    };
    return labels[type] || type;
  };

  const getTransactionVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      purchase: "default",
      consumption: "destructive",
      adjustment: "secondary",
      return: "outline",
    };
    return variants[type] || "default";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{materialName} - İşlem Geçmişi</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Henüz işlem yapılmamış</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem Türü</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Referans</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">
                    {new Date(t.created_at).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTransactionVariant(t.transaction_type)}>
                      {getTransactionLabel(t.transaction_type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      t.quantity > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.quantity > 0 ? "+" : ""}
                    {t.quantity}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.reference_type && t.reference_id
                      ? `${t.reference_type} #${t.reference_id.slice(0, 8)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(t.profiles as any)?.full_name || "Sistem"}
                  </TableCell>
                  <TableCell className="text-sm">{t.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
