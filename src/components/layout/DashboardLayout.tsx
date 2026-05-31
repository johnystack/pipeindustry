import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingUp,
  Landmark,
  ArrowLeftRight,
  User,
  Settings,
  LogOut,
  Loader2,
  Shield,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Gem,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "../../lib/supabaseClient";
import { cn } from "@/lib/utils";

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (role === "vendor" && location.pathname === "/dashboard") {
        navigate("/vendor-dashboard", { replace: true });
      } else if (role === "trader" && location.pathname === "/vendor-dashboard") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [role, loading, user, location.pathname, navigate]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const userNavigation = useMemo(() => {
    // If admin, show all links
    if (role === "admin") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Vendor Hub", href: "/vendor-dashboard", icon: Briefcase },
        { name: "Invest Now", href: "/invest-now", icon: Gem },
        { name: "Withdraw", href: "/withdraw", icon: Landmark },
        { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
        { name: "Referrals", href: "/referrals", icon: User },
        { name: "Admin", href: "/admin", icon: Shield },
        { name: "Settings", href: "/settings", icon: Settings },
      ];
    }

    // If vendor, show only vendor-related links
    if (role === "vendor") {
      return [
        { name: "Vendor Dashboard", href: "/vendor-dashboard", icon: Briefcase },
        { name: "Settings", href: "/settings", icon: Settings },
      ];
    }

    // Default: Trader/Investor links
    return [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Invest Now", href: "/invest-now", icon: Gem },
      { name: "Withdraw", href: "/withdraw", icon: Landmark },
      { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { name: "Referrals", href: "/referrals", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ];
  }, [role]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800">
      <SidebarHeader className="p-6 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-black tracking-tighter text-white">
                TerrasInvestment
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-slate-800 text-slate-400"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 p-3 mt-4 overflow-y-auto scrollbar-hide">
        <SidebarMenu className="space-y-1">
          {userNavigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Link to={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  className={cn(
                    "w-full h-11 px-3 rounded-xl transition-all duration-200 gap-3 font-bold",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "hover:bg-slate-900 hover:text-white text-slate-400"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive(item.href) ? "text-white" : "text-slate-500")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full h-11 px-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-slate-400 transition-colors gap-3 font-bold"
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );

  const mobileSidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <SidebarHeader className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">
            TerrasInvestment
          </span>
        </div>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="flex flex-col gap-2">
          {userNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl h-12 text-slate-400 hover:bg-red-500/10 hover:text-red-500 font-bold"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-900 w-full overflow-hidden">
        {/* Sidebar - Always visible like desktop */}
        <div className={cn(
          "transition-all duration-300 ease-in-out h-screen sticky top-0 border-r border-slate-800 shrink-0 bg-slate-950",
          isCollapsed ? "w-20" : "w-64"
        )}>
          {sidebarContent}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col h-screen overflow-hidden min-w-[320px]">
          <DashboardHeader className="bg-slate-950/50 backdrop-blur-xl border-slate-800" />
          
          <main className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 custom-scrollbar relative">
            {/* Subtle Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10 p-4 md:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

