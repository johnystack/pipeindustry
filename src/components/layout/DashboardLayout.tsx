import { useMemo } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
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
import { LayoutDashboard, TrendingUp, Landmark, ArrowLeftRight, User, Settings, LogOut, Loader2, Shield } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "../../lib/supabaseClient";

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const userNavigation = useMemo(() => {
    const nav = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Invest Now", href: "/invest-now", icon: Landmark },
      { name: "Withdraw", href: "/withdraw", icon: Landmark },
      { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
      { name: "Referrals", href: "/referrals", icon: User },
      { name: "Settings", href: "/settings", icon: Settings },
    ];

    if (role === 'admin') {
      nav.push({ name: "Admin", href: "/admin", icon: Shield });
    }

    return nav;
  }, [role]);

  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">PipIndustry</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {userNavigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Link to={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
  
  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">PipIndustry</span>
            </div>
        </SidebarHeader>
        <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-2">
                {userNavigation.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive(item.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
        <SidebarFooter>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </Button>
        </SidebarFooter>
    </div>
  );


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar>{sidebarContent}</Sidebar>
        </div>

        <div className="flex flex-1 flex-col">
          <Sheet>
            <DashboardHeader />
            <SheetContent side="left" className="w-72 p-0">
              {mobileSidebarContent}
            </SheetContent>
          </Sheet>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};