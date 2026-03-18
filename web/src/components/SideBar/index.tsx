import { User, Home, FileText, Settings, Book, BarChart2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { menuItems } from "@/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  Home,
  Book,
  AlertCircle,
  BarChart2,
  Settings,
  Profile: User,
  default: FileText,
} as const;

const SideBar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
        <img
          src="https://avatars.githubusercontent.com/u/45908451"
          alt="avatar"
          className="h-8 w-8 rounded-full"
        />
        <span className="font-medium">mahoo12138</span>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map(({ path, icon, label }) => {
            const IconComponent = iconMap[icon] || iconMap.default;
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link 
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  )} 
                  to={path}
                >
                  <IconComponent size={18} /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default SideBar;