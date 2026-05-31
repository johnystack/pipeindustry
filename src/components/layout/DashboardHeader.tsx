import { Button } from "@/components/ui/button";
import { Menu, User, Briefcase, TrendingUp } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  className?: string;
}

export const DashboardHeader = ({ className }: DashboardHeaderProps) => {
  const { role, avatar_url, user } = useAuth();
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
          <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white">
            <Menu className="h-5 w-5" />
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
                  ? "bg-primary text-primary-foreground" 
                  : "text-slate-400"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Trader
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendor-dashboard")}
              className={cn(
                "h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all gap-2",
                isVendorView 
                  ? "bg-emerald-500 text-white" 
                  : "text-slate-400"
              )}
            >
              <Briefcase className="h-3 w-3" />
              Vendor
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden text-slate-400"
            onClick={() => navigate(isVendorView ? "/dashboard" : "/vendor-dashboard")}
          >
            {isVendorView ? <TrendingUp className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          </Button>
        )}
        
        <div 
          className="h-9 w-9 cursor-pointer"
          onClick={() => navigate("/settings")}
        >
          <Avatar className="h-full w-full border border-primary/20 hover:border-primary/50 transition-all">
            <AvatarImage src={avatar_url || ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-black uppercase">
              {user?.email?.[0] || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};


