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
  SidebarInset,
  useSidebar,
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
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "../../lib/supabaseClient";
import { cn } from "@/lib/utils";

const DashboardSidebar = ({ role, isCollapsed, setIsCollapsed }: { role: string | null, isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const userNavigation = useMemo(() => {
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
    if (role === "vendor") {
      return [
        { name: "Vendor Dashboard", href: "/vendor-dashboard", icon: Briefcase },
        { name: "Settings", href: "/settings", icon: Settings },
      ];
    }
    return [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Invest Now", href: "/invest-now", icon: Gem },
      { name: "Withdraw", href: "/withdraw", icon: Landmark },
      { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { name: "Referrals", href: "/referrals", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ];
  }, [role]);

  return (
    <Sidebar collapsible="icon" className="border-slate-800 bg-slate-950">
      <SidebarHeader className="p-6 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20 shrink-0">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-black tracking-tighter text-white truncate group-data-[collapsible=icon]:hidden">
              TerrasInvestment
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-3 mt-4 overflow-y-auto scrollbar-hide">
        <SidebarMenu className="space-y-1">
          {userNavigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Link to={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={item.name}
                  className={cn(
                    "w-full h-11 px-3 rounded-xl transition-all duration-200 gap-3 font-bold",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "hover:bg-slate-900 hover:text-white text-slate-400"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-white" : "text-slate-500")} />
                  <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
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
              tooltip="Logout"
              className="w-full h-11 px-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-slate-400 transition-colors gap-3 font-bold"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-slate-900 w-full">
        <DashboardSidebar role={role} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <SidebarInset className="flex flex-1 flex-col h-screen overflow-hidden bg-slate-900">
          <DashboardHeader className="bg-slate-950/50 backdrop-blur-xl border-slate-800" />

          <main className="flex-1 overflow-y-auto text-slate-100 custom-scrollbar relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};


