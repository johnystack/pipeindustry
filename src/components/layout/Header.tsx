import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, TrendingUp, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, avatar_url } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const guestNavigation = [
    { name: "Market", href: "/invest" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const userHeaderNavigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Market", href: "/invest" },
  ];

  const currentNav = user ? userHeaderNavigation : guestNavigation;
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 select-none">
          <div className="p-1.5 bg-primary rounded-lg shadow-lg shadow-primary/20">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase italic text-white">
            TerrasInvestment
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {currentNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/signup">
                <Button size="sm" className="h-9 px-6 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest">
                  Join Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/settings" className="flex items-center">
                <Avatar className="h-8 w-8 border border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                    <AvatarImage src={avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black uppercase text-[10px]">
                        {user?.email?.[0]}
                    </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-slate-950 border-white/5 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/5">
                  <Link to="/" className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-lg font-black tracking-tighter uppercase italic text-white">TerrasInvestment</span>
                  </Link>
                </div>

                <nav className="flex flex-col p-4 gap-2">
                  {currentNav.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {!user ? (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3 px-2">
                      <Link to="/login">
                        <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest">
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2 px-2">
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                        <User className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-destructive/10 text-slate-400 hover:text-destructive transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                      </button>
                    </div>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
