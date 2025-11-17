import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TaskStatusPieChartProps {
  data: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  in_progress: "Devam Eden",
  completed: "Tamamlanan",
  cancelled: "İptal Edilen",
};

const COLORS = {
  pending: "hsl(var(--primary))",
  in_progress: "hsl(var(--warning))",
  completed: "hsl(var(--success))",
  cancelled: "hsl(var(--destructive))",
};

export const TaskStatusPieChart = ({ data }: TaskStatusPieChartProps) => {
  const chartData = [
    { name: STATUS_LABELS.pending, value: data.pending, color: COLORS.pending },
    { name: STATUS_LABELS.in_progress, value: data.in_progress, color: COLORS.in_progress },
    { name: STATUS_LABELS.completed, value: data.completed, color: COLORS.completed },
    { name: STATUS_LABELS.cancelled, value: data.cancelled, color: COLORS.cancelled },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Görev Durumu Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
