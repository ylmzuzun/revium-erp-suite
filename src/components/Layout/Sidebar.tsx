import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Üretim Siparişleri", path: "/production" },
  { icon: Users, label: "Görevler", path: "/tasks" },
  { icon: ShoppingCart, label: "Siparişler", path: "/orders" },
  { icon: Users, label: "Müşteriler", path: "/customers" },
  { icon: Package, label: "Ürünler", path: "/products" },
  { icon: FileText, label: "Raporlar", path: "/reports" },
  { icon: Settings, label: "Ayarlar", path: "/settings" },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-sidebar-primary" />
          <span className="text-xl font-bold text-sidebar-foreground">Revium ERP</span>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
