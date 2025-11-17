import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProductionStatusBarChartProps {
  data: {
    planned: number;
    in_production: number;
    quality_check: number;
    completed: number;
    on_hold: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planlandı",
  in_production: "Üretimde",
  quality_check: "Kalite Kontrol",
  completed: "Tamamlandı",
  on_hold: "Beklemede",
};

export const ProductionStatusBarChart = ({ data }: ProductionStatusBarChartProps) => {
  const chartData = [
    { name: STATUS_LABELS.planned, value: data.planned, fill: "hsl(var(--primary))" },
    { name: STATUS_LABELS.in_production, value: data.in_production, fill: "hsl(var(--warning))" },
    { name: STATUS_LABELS.quality_check, value: data.quality_check, fill: "hsl(var(--accent))" },
    { name: STATUS_LABELS.completed, value: data.completed, fill: "hsl(var(--success))" },
    { name: STATUS_LABELS.on_hold, value: data.on_hold, fill: "hsl(var(--muted))" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Üretim Durumu Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Sipariş Sayısı" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
