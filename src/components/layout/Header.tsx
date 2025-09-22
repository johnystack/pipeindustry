import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, TrendingUp, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabaseClient";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Guest navigation
  const guestNavigation = [
    { name: "Home", href: "/" },
    { name: "Investment Plans", href: "/invest" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  // User (authenticated) navigation in the header is often minimal,
  // as the main navigation is in the sidebar.
  // We can keep it empty or add a few key links if needed.
  const userHeaderNavigation = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Support", href: "/support" },
  ];

  const currentNav = user ? userHeaderNavigation : guestNavigation;
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 select-none">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            PipIndustry
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 xl:gap-8">
          {currentNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="text-sm font-medium">
                  Create Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-base font-semibold">PipIndustry</span>
              </div>

              <nav className="flex flex-col">
                {currentNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-1 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {!user ? (
                  <div className="pt-4 mt-4 border-t">
                    <Link to="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="sm" className="w-full mt-2">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="pt-4 mt-4 border-t">
                    <Link to="/profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
