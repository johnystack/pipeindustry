import { Button } from "@/components/ui/button";
import { Menu, User, Bell, Briefcase, TrendingUp } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  className?: string;
}

export const DashboardHeader = ({ className }: DashboardHeaderProps) => {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isVendorView = location.pathname.includes("vendor-dashboard");
  const isAdmin = role === "admin";

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-16 items-center justify-between border-b px-6 md:px-10",
      className
    )}>
      <div className="flex items-center gap-4">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>

        {isAdmin && (
          <div className="hidden sm:flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 shadow-inner">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className={cn(
                "h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all gap-2",
                !isVendorView 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Trader Mode
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor-dashboard")}
              className={cn(
                "h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all gap-2",
                isVendorView 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Briefcase className="h-3 w-3" />
              Vendor Mode
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Mobile View Toggle */}
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => navigate(isVendorView ? "/dashboard" : "/vendor-dashboard")}
          >
            {isVendorView ? <TrendingUp className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          </Button>
        )}
        
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full">
            <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    </header>
  );
};


