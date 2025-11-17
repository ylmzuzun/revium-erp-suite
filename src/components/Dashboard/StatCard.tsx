import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

export const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  const variantStyles = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-primary to-primary/80",
    success: "bg-gradient-to-br from-success to-success/80",
    warning: "bg-gradient-to-br from-warning to-warning/80",
  };

  const isColored = variant !== "default";

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              "text-sm font-medium",
              isColored ? "text-white/80" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <h3 className={cn(
              "text-3xl font-bold mt-2",
              isColored ? "text-white" : "text-foreground"
            )}>
              {value}
            </h3>
            {trend && (
              <p className={cn(
                "text-sm mt-2 flex items-center gap-1",
                isColored ? "text-white/90" : trend.positive ? "text-success" : "text-destructive"
              )}>
                <span>{trend.positive ? "↑" : "↓"}</span>
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-full",
            isColored ? "bg-white/20" : "bg-muted"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              isColored ? "text-white" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
