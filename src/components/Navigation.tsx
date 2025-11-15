import { Building2, LayoutDashboard, BedDouble, Users, IndianRupee, LogOut, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { PropertySelector } from "./PropertySelector";

const Navigation = () => {
  const { signOut } = useAuth();
  
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/rooms", icon: BedDouble, label: "Rooms" },
    { to: "/guests", icon: Users, label: "Guests" },
    { to: "/expenses", icon: IndianRupee, label: "Expenses" },
    { to: "/properties", icon: Settings, label: "Properties" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-foreground">PGManager</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <PropertySelector />
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-2 ml-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
